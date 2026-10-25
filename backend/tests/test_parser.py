import pytest
from app.parser import parse_chat_text

def test_whatsapp_bracket_format():
    sample = """[10/24/24, 9:15:00 AM] Alice: We need to deploy the hotfix today.
[10/24/24, 9:16:12 AM] Bob: Agreed, who is handling the database migrations?
[10/24/24, 9:18:45 AM] Alice: Charlie is taking care of migrations by 2 PM."""

    messages = parse_chat_text(sample)
    assert len(messages) == 3
    assert messages[0].id == "msg_1"
    assert messages[0].sender == "Alice"
    assert "deploy the hotfix" in messages[0].content
    assert messages[0].timestamp == "10/24/24, 9:15:00 AM"

    assert messages[1].id == "msg_2"
    assert messages[1].sender == "Bob"

    assert messages[2].id == "msg_3"
    assert messages[2].sender == "Alice"
    assert "Charlie is taking care" in messages[2].content

def test_whatsapp_dash_format():
    sample = """10/24/24, 9:15 AM - Alice: Frontend build succeeded.
10/24/24, 9:17 AM - Bob: Great, let's notify QA."""
    messages = parse_chat_text(sample)
    assert len(messages) == 2
    assert messages[0].sender == "Alice"
    assert messages[1].sender == "Bob"
    assert messages[0].id == "msg_1"
    assert messages[1].id == "msg_2"

def test_iso_dash_format():
    sample = """2024-10-24 14:30:00 - DevLead: Architecture decision: we are adopting SQLite for local storage.
2024-10-24 14:31:00 - Engineer: Does it support async queries?
2024-10-24 14:32:00 - DevLead: Yes, through aiosqlite."""
    messages = parse_chat_text(sample)
    assert len(messages) == 3
    assert messages[0].sender == "DevLead"
    assert messages[0].timestamp == "2024-10-24 14:30:00"
    assert "adopting SQLite" in messages[0].content

def test_multiline_message_continuation():
    sample = """[10/24/24, 10:00 AM] DevLead: Here is the stack trace:
TypeError: Cannot read properties of undefined
    at calculateMetrics (metrics.js:42)
    at runSync (server.js:108)
[10/24/24, 10:02 AM] SRE: Looking into it now."""
    messages = parse_chat_text(sample)
    assert len(messages) == 2
    assert "TypeError: Cannot read properties of undefined" in messages[0].content
    assert "metrics.js:42" in messages[0].content
    assert messages[1].sender == "SRE"

def test_empty_and_whitespace():
    assert parse_chat_text("") == []
    assert parse_chat_text("   \n\n   ") == []

def test_raw_line_numbers():
    sample = """[10/24/24, 9:00 AM] Alice: First message

[10/24/24, 9:05 AM] Bob: Second message after empty line"""
    messages = parse_chat_text(sample)
    assert len(messages) == 2
    assert messages[0].raw_line_number == 1
    assert messages[1].raw_line_number == 3
