import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
import aiosqlite
from app.config import DB_PATH
from app.models import (
    ParsedMessage,
    ConversationSummary,
    ConversationDetail,
    BriefingResponse,
    UpdateItemResponse,
    DecisionItemResponse,
    ActionItemResponse,
    QuestionItemResponse,
    BriefingPayload,
)

@asynccontextmanager
async def get_db():
    conn = await aiosqlite.connect(DB_PATH)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        await conn.close()

async def init_db():
    """Initializes SQLite tables if they do not exist."""
    async with get_db() as db:
        await db.executescript("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            filename TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            message_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT NOT NULL,
            conversation_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            content TEXT NOT NULL,
            raw_line_number INTEGER NOT NULL,
            PRIMARY KEY (conversation_id, id),
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS briefings (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            executive_summary TEXT NOT NULL,
            model_used TEXT NOT NULL,
            raw_response TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS briefing_updates (
            id TEXT PRIMARY KEY,
            briefing_id TEXT NOT NULL,
            category TEXT NOT NULL,
            text TEXT NOT NULL,
            source_message_ids TEXT NOT NULL,
            FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS briefing_decisions (
            id TEXT PRIMARY KEY,
            briefing_id TEXT NOT NULL,
            decision TEXT NOT NULL,
            context TEXT,
            source_message_ids TEXT NOT NULL,
            FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS briefing_action_items (
            id TEXT PRIMARY KEY,
            briefing_id TEXT NOT NULL,
            task TEXT NOT NULL,
            assignee TEXT,
            deadline TEXT,
            completed INTEGER NOT NULL DEFAULT 0,
            source_message_ids TEXT NOT NULL,
            FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS briefing_questions (
            id TEXT PRIMARY KEY,
            briefing_id TEXT NOT NULL,
            question TEXT NOT NULL,
            asker TEXT,
            source_message_ids TEXT NOT NULL,
            FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
        );
        """)
        await db.commit()

# --- Conversation DB Operations ---

async def create_conversation(title: str, filename: str, raw_text: str, messages: List[ParsedMessage]) -> str:
    conv_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    async with get_db() as db:
        await db.execute(
            "INSERT INTO conversations (id, title, filename, raw_text, message_count, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (conv_id, title, filename, raw_text, len(messages), now),
        )
        for msg in messages:
            await db.execute(
                "INSERT INTO messages (id, conversation_id, sender, timestamp, content, raw_line_number) VALUES (?, ?, ?, ?, ?, ?)",
                (msg.id, conv_id, msg.sender, msg.timestamp, msg.content, msg.raw_line_number),
            )
        await db.commit()
    return conv_id

async def list_conversations() -> List[ConversationSummary]:
    async with get_db() as db:
        cursor = await db.execute("""
            SELECT c.id, c.title, c.filename, c.message_count, c.created_at,
                   COUNT(b.id) as briefing_count
            FROM conversations c
            LEFT JOIN briefings b ON c.id = b.conversation_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        """)
        rows = await cursor.fetchall()
        return [
            ConversationSummary(
                id=row["id"],
                title=row["title"],
                filename=row["filename"],
                message_count=row["message_count"],
                briefing_count=row["briefing_count"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

async def get_conversation(conv_id: str) -> Optional[ConversationDetail]:
    async with get_db() as db:
        cursor = await db.execute("SELECT id, title, filename, created_at FROM conversations WHERE id = ?", (conv_id,))
        conv_row = await cursor.fetchone()
        if not conv_row:
            return None

        # Fetch messages
        msg_cursor = await db.execute(
            "SELECT id, sender, timestamp, content, raw_line_number FROM messages WHERE conversation_id = ? ORDER BY raw_line_number ASC",
            (conv_id,),
        )
        msg_rows = await msg_cursor.fetchall()
        messages = [
            ParsedMessage(
                id=row["id"],
                sender=row["sender"],
                timestamp=row["timestamp"],
                content=row["content"],
                raw_line_number=row["raw_line_number"],
            )
            for row in msg_rows
        ]

        # Fetch briefings for this conversation
        briefings = await _get_briefings_for_conversation_with_conn(conv_id, db)

        return ConversationDetail(
            id=conv_row["id"],
            title=conv_row["title"],
            filename=conv_row["filename"],
            created_at=conv_row["created_at"],
            messages=messages,
            briefings=briefings,
        )

async def delete_conversation(conv_id: str) -> bool:
    async with get_db() as db:
        cursor = await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()
        return cursor.rowcount > 0

# --- Briefing DB Operations ---

async def save_briefing(
    conversation_id: str,
    payload: BriefingPayload,
    model_used: str,
    raw_response: Optional[str] = None
) -> str:
    briefing_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"

    async with get_db() as db:
        await db.execute(
            "INSERT INTO briefings (id, conversation_id, executive_summary, model_used, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (briefing_id, conversation_id, payload.executive_summary, model_used, raw_response, now),
        )

        for u in payload.important_updates:
            u_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO briefing_updates (id, briefing_id, category, text, source_message_ids) VALUES (?, ?, ?, ?, ?)",
                (u_id, briefing_id, u.category, u.text, json.dumps(u.source_message_ids)),
            )

        for d in payload.decisions_made:
            d_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO briefing_decisions (id, briefing_id, decision, context, source_message_ids) VALUES (?, ?, ?, ?, ?)",
                (d_id, briefing_id, d.decision, d.context, json.dumps(d.source_message_ids)),
            )

        for a in payload.action_items:
            a_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO briefing_action_items (id, briefing_id, task, assignee, deadline, completed, source_message_ids) VALUES (?, ?, ?, ?, ?, 0, ?)",
                (a_id, briefing_id, a.task, a.assignee, a.deadline, json.dumps(a.source_message_ids)),
            )

        for q in payload.unanswered_questions:
            q_id = str(uuid.uuid4())
            await db.execute(
                "INSERT INTO briefing_questions (id, briefing_id, question, asker, source_message_ids) VALUES (?, ?, ?, ?, ?)",
                (q_id, briefing_id, q.question, q.asker, json.dumps(q.source_message_ids)),
            )

        await db.commit()
    return briefing_id

async def _get_briefings_for_conversation_with_conn(conv_id: str, db: aiosqlite.Connection) -> List[BriefingResponse]:
    cursor = await db.execute(
        "SELECT id, conversation_id, executive_summary, model_used, created_at FROM briefings WHERE conversation_id = ? ORDER BY created_at DESC",
        (conv_id,),
    )
    rows = await cursor.fetchall()
    result = []
    for r in rows:
        b = await _populate_briefing(r["id"], r["conversation_id"], r["executive_summary"], r["model_used"], r["created_at"], db)
        result.append(b)
    return result

async def get_briefing_by_id(briefing_id: str) -> Optional[BriefingResponse]:
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, conversation_id, executive_summary, model_used, created_at FROM briefings WHERE id = ?",
            (briefing_id,),
        )
        row = await cursor.fetchone()
        if not row:
            return None
        return await _populate_briefing(row["id"], row["conversation_id"], row["executive_summary"], row["model_used"], row["created_at"], db)

async def _populate_briefing(
    briefing_id: str,
    conversation_id: str,
    executive_summary: str,
    model_used: str,
    created_at: str,
    db: aiosqlite.Connection
) -> BriefingResponse:
    # Updates
    u_cursor = await db.execute("SELECT id, category, text, source_message_ids FROM briefing_updates WHERE briefing_id = ?", (briefing_id,))
    u_rows = await u_cursor.fetchall()
    updates = [
        UpdateItemResponse(
            id=r["id"],
            briefing_id=briefing_id,
            category=r["category"],
            text=r["text"],
            source_message_ids=json.loads(r["source_message_ids"]),
        )
        for r in u_rows
    ]

    # Decisions
    d_cursor = await db.execute("SELECT id, decision, context, source_message_ids FROM briefing_decisions WHERE briefing_id = ?", (briefing_id,))
    d_rows = await d_cursor.fetchall()
    decisions = [
        DecisionItemResponse(
            id=r["id"],
            briefing_id=briefing_id,
            decision=r["decision"],
            context=r["context"],
            source_message_ids=json.loads(r["source_message_ids"]),
        )
        for r in d_rows
    ]

    # Action items
    a_cursor = await db.execute("SELECT id, task, assignee, deadline, completed, source_message_ids FROM briefing_action_items WHERE briefing_id = ?", (briefing_id,))
    a_rows = await a_cursor.fetchall()
    action_items = [
        ActionItemResponse(
            id=r["id"],
            briefing_id=briefing_id,
            task=r["task"],
            assignee=r["assignee"],
            deadline=r["deadline"],
            completed=bool(r["completed"]),
            source_message_ids=json.loads(r["source_message_ids"]),
        )
        for r in a_rows
    ]

    # Questions
    q_cursor = await db.execute("SELECT id, question, asker, source_message_ids FROM briefing_questions WHERE briefing_id = ?", (briefing_id,))
    q_rows = await q_cursor.fetchall()
    questions = [
        QuestionItemResponse(
            id=r["id"],
            briefing_id=briefing_id,
            question=r["question"],
            asker=r["asker"],
            source_message_ids=json.loads(r["source_message_ids"]),
        )
        for r in q_rows
    ]

    # Collect all cited message IDs across all sections
    all_cited_ids = set()
    for item in updates + decisions + action_items + questions:
        for mid in item.source_message_ids:
            all_cited_ids.add(mid)

    # Fetch cited messages from database for instant inline citation preview
    cited_messages: Dict[str, ParsedMessage] = {}
    if all_cited_ids:
        placeholders = ",".join("?" for _ in all_cited_ids)
        msg_cursor = await db.execute(
            f"SELECT id, sender, timestamp, content, raw_line_number FROM messages WHERE conversation_id = ? AND id IN ({placeholders})",
            [conversation_id] + list(all_cited_ids),
        )
        msg_rows = await msg_cursor.fetchall()
        for m in msg_rows:
            cited_messages[m["id"]] = ParsedMessage(
                id=m["id"],
                sender=m["sender"],
                timestamp=m["timestamp"],
                content=m["content"],
                raw_line_number=m["raw_line_number"],
            )

    return BriefingResponse(
        id=briefing_id,
        conversation_id=conversation_id,
        executive_summary=executive_summary,
        created_at=created_at,
        model_used=model_used,
        updates=updates,
        decisions=decisions,
        action_items=action_items,
        questions=questions,
        cited_messages=cited_messages,
    )

async def toggle_action_item_completed(item_id: str) -> Optional[bool]:
    """Toggles completion state of an action item. Returns new state or None if not found."""
    async with get_db() as db:
        cursor = await db.execute("SELECT completed FROM briefing_action_items WHERE id = ?", (item_id,))
        row = await cursor.fetchone()
        if not row:
            return None
        new_state = 0 if row["completed"] else 1
        await db.execute("UPDATE briefing_action_items SET completed = ? WHERE id = ?", (new_state, item_id))
        await db.commit()
        return bool(new_state)

async def list_all_briefings() -> List[Dict[str, Any]]:
    """Returns all briefings with conversation metadata for the History view."""
    async with get_db() as db:
        cursor = await db.execute("""
            SELECT b.id, b.conversation_id, b.executive_summary, b.model_used, b.created_at,
                   c.title as conversation_title, c.filename as conversation_filename,
                   (SELECT COUNT(*) FROM briefing_action_items a WHERE a.briefing_id = b.id) as total_tasks,
                   (SELECT COUNT(*) FROM briefing_action_items a WHERE a.briefing_id = b.id AND a.completed = 1) as completed_tasks
            FROM briefings b
            JOIN conversations c ON b.conversation_id = c.id
            ORDER BY b.created_at DESC
        """)
        rows = await cursor.fetchall()
        return [
            {
                "id": r["id"],
                "conversation_id": r["conversation_id"],
                "conversation_title": r["conversation_title"],
                "conversation_filename": r["conversation_filename"],
                "executive_summary": r["executive_summary"],
                "model_used": r["model_used"],
                "created_at": r["created_at"],
                "total_tasks": r["total_tasks"],
                "completed_tasks": r["completed_tasks"],
            }
            for r in rows
        ]
