import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, save_briefing, toggle_action_item_completed
from app.models import BriefingPayload, ActionItem, DecisionItem, UpdateItem, QuestionItem

@pytest.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["app"] == "AfterHours"
        assert "Your conversations" in data["tagline"]

@pytest.mark.asyncio
async def test_ollama_status_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/ollama/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "available" in data
        assert "configured_model" in data

@pytest.mark.asyncio
async def test_sample_loading_and_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Fetch sample list
        samples_resp = await client.get("/api/conversations/samples")
        assert samples_resp.status_code == 200
        samples = samples_resp.json()
        assert len(samples) >= 3

        # 2. Load the first sample
        sample_id = samples[0]["id"]
        load_resp = await client.post(f"/api/conversations/load-sample/{sample_id}")
        assert load_resp.status_code == 200
        loaded_conv = load_resp.json()
        conv_id = loaded_conv["id"]
        assert len(loaded_conv["messages"]) > 0
        assert loaded_conv["messages"][0]["id"] == "msg_1"

        # 3. Retrieve conversation detail
        get_resp = await client.get(f"/api/conversations/{conv_id}")
        assert get_resp.status_code == 200
        detail = get_resp.json()
        assert detail["id"] == conv_id
        assert detail["title"] == samples[0]["title"]

@pytest.mark.asyncio
async def test_import_and_delete_conversation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        chat_content = """[10/24/24, 10:00:00 AM] Alice: Let's test custom import.
[10/24/24, 10:01:00 AM] Bob: Confirmed working."""

        # Import
        resp = await client.post("/api/conversations/import", json={
            "title": "Custom Test Chat",
            "filename": "test.txt",
            "raw_text": chat_content
        })
        assert resp.status_code == 200
        conv = resp.json()
        assert conv["title"] == "Custom Test Chat"
        assert len(conv["messages"]) == 2

        # Delete
        del_resp = await client.delete(f"/api/conversations/{conv['id']}")
        assert del_resp.status_code == 200

        # Verify 404 after delete
        check_resp = await client.get(f"/api/conversations/{conv['id']}")
        assert check_resp.status_code == 404

@pytest.mark.asyncio
async def test_action_item_toggle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Load sample to have a real conversation
        load_resp = await client.post("/api/conversations/load-sample/sample-sprint-planning")
        conv = load_resp.json()
        conv_id = conv["id"]

        # Save a briefing directly into DB to test toggle persistence
        briefing_payload = BriefingPayload(
            executive_summary="Test sprint briefing",
            important_updates=[],
            decisions_made=[],
            action_items=[
                ActionItem(
                    task="Write Dexie storage wrapper",
                    assignee="Elena",
                    deadline="Friday 4 PM",
                    source_message_ids=["msg_6"]
                )
            ],
            unanswered_questions=[]
        )
        briefing_id = await save_briefing(conv_id, briefing_payload, "qwen2.5:3b")

        # Fetch briefing to get action item ID
        b_resp = await client.get(f"/api/briefings/{briefing_id}")
        assert b_resp.status_code == 200
        briefing = b_resp.json()
        item_id = briefing["action_items"][0]["id"]
        assert briefing["action_items"][0]["completed"] is False

        # Toggle item to completed
        toggle_resp = await client.patch(f"/api/briefings/action-items/{item_id}/toggle")
        assert toggle_resp.status_code == 200
        toggle_data = toggle_resp.json()
        assert toggle_data["completed"] is True

        # Toggle back to uncompleted
        toggle_resp2 = await client.patch(f"/api/briefings/action-items/{item_id}/toggle")
        assert toggle_resp2.status_code == 200
        assert toggle_resp2.json()["completed"] is False
