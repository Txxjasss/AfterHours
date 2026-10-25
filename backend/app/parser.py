import re
from typing import List, Optional, Tuple
from app.models import ParsedMessage

# Regex patterns for common chat export message headers.
# Each pattern extracts: (timestamp_string, sender_name, message_body)
PATTERNS = [
    # 1. WhatsApp bracket style:
    # [10/24/24, 9:15:32 AM] Alice: Hello
    # [24/10/2024, 09:15:32] Alice Smith: Hello
    # [2024-10-24 09:15:32] Alice: Hello
    re.compile(
        r"^\[(?P<ts>\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s*(?P<sender>[^:\n]+?):\s*(?P<body>.*)$"
    ),

    # 2. WhatsApp dash style:
    # 10/24/24, 9:15 AM - Alice: Hello
    # 24/10/2024, 09:15 - Alice: Hello
    re.compile(
        r"^(?P<ts>\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s*-\s*(?P<sender>[^:\n]+?):\s*(?P<body>.*)$"
    ),

    # 3. ISO / Standard datetime dash style:
    # 2024-10-24 09:15:32 - Alice: Hello
    # 2024-10-24 09:15 - Alice: Hello
    re.compile(
        r"^(?P<ts>\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\s*(?:-|–|:)\s*(?P<sender>[^:\n]+?):\s*(?P<body>.*)$"
    ),

    # 4. Bracketed time only (e.g. Slack log exports or IRC):
    # [09:15:32] Alice: Hello
    # [09:15 AM] Alice: Hello
    re.compile(
        r"^\[(?P<ts>\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s*(?P<sender>[^:\n]+?):\s*(?P<body>.*)$"
    ),

    # 5. Name followed by timestamp in brackets/parentheses:
    # Alice [09:15 AM]: Hello
    # Alice (2024-10-24 09:15): Hello
    re.compile(
        r"^(?P<sender>[^\[\(\n]+?)\s*[\[\(](?P<ts>\d{1,4}[-/\.]\d{1,2}[-/\.]\d{1,4}(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?|\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)[\]\)]:\s*(?P<body>.*)$"
    ),

    # 6. IRC style:
    # <Alice> Hello world
    re.compile(
        r"^<(?P<sender>[^>\n]+)>\s*(?P<body>.*)$"
    ),
]

def try_match_line(line: str) -> Optional[Tuple[str, str, str]]:
    """
    Attempts to match a line against known chat headers.
    Returns (timestamp, sender, content) if matched, else None.
    """
    stripped = line.strip()
    if not stripped:
        return None

    for pattern in PATTERNS:
        match = pattern.match(line)
        if match:
            groups = match.groupdict()
            ts = groups.get("ts", "").strip() if "ts" in groups else "N/A"
            sender = groups.get("sender", "").strip()
            body = groups.get("body", "")
            if sender:
                return ts, sender, body

    return None

def parse_chat_text(raw_text: str) -> List[ParsedMessage]:
    """
    Parses raw chat export text into a list of structured ParsedMessage objects.
    Preserves multi-line messages, assigns stable IDs (msg_1, msg_2, ...),
    and records line numbers.
    """
    lines = raw_text.splitlines()
    messages: List[ParsedMessage] = []

    current_msg_id_num = 1
    current_msg: Optional[ParsedMessage] = None

    for idx, line in enumerate(lines, start=1):
        match = try_match_line(line)
        if match:
            # If we were tracking a previous message, finalize it
            if current_msg is not None:
                current_msg.content = current_msg.content.strip()
                messages.append(current_msg)

            ts, sender, body = match
            current_msg = ParsedMessage(
                id=f"msg_{current_msg_id_num}",
                sender=sender,
                timestamp=ts,
                content=body,
                raw_line_number=idx,
            )
            current_msg_id_num += 1
        else:
            # Multi-line continuation of current message
            if current_msg is not None:
                current_msg.content += "\n" + line
            elif line.strip():
                # Line before any recognized message header (e.g. header comments or export note)
                # Treat as system announcement if it has text
                current_msg = ParsedMessage(
                    id=f"msg_{current_msg_id_num}",
                    sender="System",
                    timestamp="Export",
                    content=line.strip(),
                    raw_line_number=idx,
                )
                current_msg_id_num += 1

    if current_msg is not None:
        current_msg.content = current_msg.content.strip()
        messages.append(current_msg)

    return messages
