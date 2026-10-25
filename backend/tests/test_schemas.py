import pytest
from pydantic import ValidationError
from app.models import (
    BriefingPayload,
    UpdateItem,
    DecisionItem,
    ActionItem,
    QuestionItem,
)

def test_valid_briefing_payload():
    payload_dict = {
        "executive_summary": "The team aligned on the release schedule and resolved the Redis TTL regression.",
        "important_updates": [
            {
                "category": "Infrastructure",
                "text": "Redis cluster memory usage stabilized at 44%.",
                "source_message_ids": ["msg_11"]
            }
        ],
        "decisions_made": [
            {
                "decision": "Patch Redis TTL immediately rather than rolling back.",
                "context": "Payment fixes are critical.",
                "source_message_ids": ["msg_7"]
            }
        ],
        "action_items": [
            {
                "task": "Draft hotfix branch and push to CI.",
                "assignee": "Liam",
                "deadline": "02:45 PM",
                "source_message_ids": ["msg_8"]
            },
            {
                "task": "Review Datadog metrics.",
                "assignee": None,
                "deadline": None,
                "source_message_ids": ["msg_12"]
            }
        ],
        "unanswered_questions": [
            {
                "question": "Why didn't staging smoke tests catch the missing TTL?",
                "asker": "Alex",
                "source_message_ids": ["msg_14"]
            }
        ]
    }

    validated = BriefingPayload.model_validate(payload_dict)
    assert validated.executive_summary.startswith("The team aligned")
    assert len(validated.important_updates) == 1
    assert len(validated.decisions_made) == 1
    assert len(validated.action_items) == 2
    assert validated.action_items[0].assignee == "Liam"
    assert validated.action_items[0].deadline == "02:45 PM"
    assert validated.action_items[1].assignee is None
    assert validated.unanswered_questions[0].asker == "Alex"

def test_missing_required_summary_fails():
    invalid_dict = {
        "important_updates": [],
        "decisions_made": [],
        "action_items": [],
        "unanswered_questions": []
    }
    with pytest.raises(ValidationError):
        BriefingPayload.model_validate(invalid_dict)

def test_action_item_without_assignee_is_valid():
    # Per requirements: "Deadlines and assigned people when explicitly supported by messages"
    # When not supported, assignee and deadline are None/null.
    item = ActionItem(
        task="Monitor latency metrics",
        assignee=None,
        deadline=None,
        source_message_ids=["msg_5"]
    )
    assert item.assignee is None
    assert item.deadline is None
    assert item.source_message_ids == ["msg_5"]
