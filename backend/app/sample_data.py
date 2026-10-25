SAMPLE_CONVERSATIONS = [
    {
        "id": "sample-incident-response",
        "title": "Incident #409: Checkout Service Latency",
        "filename": "incident_409_checkout.txt",
        "description": "Production postmortem chat discussing memory pressure, Redis eviction, hotfix deployment, and observability metrics.",
        "content": """[10/24/24, 02:14:10 PM] PagerDuty: [ALERT P1] High p99 latency (>3200ms) on checkout-api cluster us-east-1.
[10/24/24, 02:15:02 PM] Maya Chen (SRE): Acked. Investigating checkout-api pods right now.
[10/24/24, 02:16:30 PM] Maya Chen (SRE): CPU is normal at 28%, but memory utilization is spiking past 92% on three worker nodes.
[10/24/24, 02:17:45 PM] Liam Patel (Backend): Looking at recent commits. Did anyone touch the cart session caching in commit e839bf?
[10/24/24, 02:18:22 PM] Liam Patel (Backend): Just checked the diff. The TTL on guest cart Redis keys was accidentally omitted in the latest PR merge!
[10/24/24, 02:19:15 PM] DevLead Sarah: Good catch Liam. Let's not rollback the whole release since the payment fixes are critical.
[10/24/24, 02:20:00 PM] DevLead Sarah: Decision: We will patch the Redis TTL immediately with a 30-minute hotfix rather than reverting.
[10/24/24, 02:20:45 PM] DevLead Sarah: Liam, can you draft the hotfix branch and push it to CI by 02:45 PM?
[10/24/24, 02:21:10 PM] Liam Patel (Backend): On it. Will have PR #812 ready in 15 minutes.
[10/24/24, 02:22:05 PM] Maya Chen (SRE): In the meantime, I am manually evicting expired keys from Redis cluster replica 2 to release 4GB RAM.
[10/24/24, 02:27:30 PM] Maya Chen (SRE): Memory dropped back to 44%. Latency returning to 180ms baseline.
[10/24/24, 02:35:12 PM] Liam Patel (Backend): PR #812 is up with 20-minute default TTL and automated integration test.
[10/24/24, 02:37:00 PM] DevLead Sarah: Approved and merged. Maya, please monitor the canary deploy until 03:30 PM.
[10/24/24, 02:38:15 PM] Maya Chen (SRE): Understood, watching Datadog canary dashboard.
[10/24/24, 02:40:00 PM] Alex Kim (QA): One question: Why didn't our staging smoke tests catch the missing TTL before deployment?
[10/24/24, 02:42:10 PM] DevLead Sarah: Good point Alex. Alex, please schedule an incident postmortem meeting for tomorrow at 10:00 AM.
[10/24/24, 02:43:00 PM] Alex Kim (QA): Will send calendar invites to engineering."""
    },
    {
        "id": "sample-sprint-planning",
        "title": "Alpha Sprint 42: Roadmap & Architecture",
        "filename": "sprint_42_planning.txt",
        "description": "Weekly team planning covering SQLite local-first migration, authentication overhaul, and client offline sync.",
        "content": """[2024-10-23 10:00:15] Carlos (Tech Lead): Welcome everyone to Sprint 42 sync. Our primary milestone is releasing the offline-first sync engine.
[2024-10-23 10:02:40] Carlos (Tech Lead): Update: The WebSocket sync protocol is fully spec'd out and passed security review.
[2024-10-23 10:04:10] Elena (Core Eng): Great news. For local storage on the client side, did we decide between IndexedDB wrappers or SQLite via WASM?
[2024-10-23 10:06:50] Carlos (Tech Lead): We tested both. SQLite WASM had a 4MB bundle penalty, whereas IndexedDB with Dexie is only 40KB and runs faster on mobile browsers.
[2024-10-23 10:08:00] Carlos (Tech Lead): Decision: We are adopting Dexie (IndexedDB) for local client persistence instead of SQLite WASM.
[2024-10-23 10:10:25] Marcus (Frontend): Makes total sense. Elena, are you taking the database migration schema?
[2024-10-23 10:11:00] Elena (Core Eng): Yes, I will write the schema migrations and unit tests. I will complete this by Friday at 4 PM.
[2024-10-23 10:13:30] Marcus (Frontend): I will build the conflict resolution UI modal for merge discrepancies by Thursday afternoon.
[2024-10-23 10:15:00] Carlos (Tech Lead): What about our OAuth 2.1 token refresh flow? Has the identity provider updated their discovery endpoints yet?
[2024-10-23 10:17:20] Elena (Core Eng): Not yet, their support ticket is still pending with no estimated response date.
[2024-10-23 10:18:00] Carlos (Tech Lead): Decision: Defer OAuth 2.1 token refresh upgrade until Sprint 43 to avoid blocking this release.
[2024-10-23 10:20:10] Marcus (Frontend): Are we supporting end-to-end encryption for team workspaces in this initial phase or deferring that as well?"""
    },
    {
        "id": "sample-hackathon-prep",
        "title": "Hackathon 2026: Team AfterHours Sync",
        "filename": "hackathon_sync.txt",
        "description": "Weekend hackathon brainstorming session focusing on open-source AI, local-first privacy, and presentation pitch.",
        "content": """[10/25/26, 09:00:00 AM] Noah: Good morning team! Hackathon kickoff is in 3 hours. Let's finalize our project scope and stack.
[10/25/26, 09:01:25 AM] Priya: Morning Noah! I reviewed the prompt: "Build something with open-source AI at its core that saves effort and runs locally".
[10/25/26, 09:03:10 AM] Noah: Our idea: 'AfterHours' - a local-first briefing tool that parses group chat exports so developers can catch up in 60 seconds without cloud uploads.
[10/25/26, 09:04:30 AM] Daniel: Love that tagline: 'Your conversations. One useful briefing.'
[10/25/26, 09:05:45 AM] Daniel: For local inference, are we using Ollama with Qwen2.5 3B or Gemma 2?
[10/25/26, 09:07:00 AM] Noah: Qwen2.5 3B has incredible structured JSON following and fits in under 2.5GB RAM on laptops.
[10/25/26, 09:08:15 AM] Noah: Decision: We will use Ollama with Qwen2.5 3B for local structured output and SQLite for conversation persistence.
[10/25/26, 09:10:00 AM] Noah: Priya, can you build the React + TypeScript frontend with a cinematic dark theme and electric-blue accents?
[10/25/26, 09:11:15 AM] Priya: Yes! I will complete the initial dashboard, file dropzone, and citation preview drawer by 03:00 PM today.
[10/25/26, 09:12:40 AM] Daniel: I will build the FastAPI backend, chat regex parsers, and SQLite schema by 02:00 PM today.
[10/25/26, 09:14:00 AM] Noah: Perfect. I will wire up the Ollama client, Pydantic validation, and write the project README and test suites by 04:00 PM today.
[10/25/26, 09:15:30 AM] Priya: Question: Does the judging rubric require a live public deployment URL or is a local demo video acceptable?"""
    }
]
