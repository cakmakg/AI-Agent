# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Development Commands

### Backend (server/)
```bash
# Start the server (no npm start script — run directly)
cd server && node src/index.js

# Install dependencies
cd server && npm install
```
Server runs on `http://localhost:4000` (configurable via `PORT` in `.env`).

### Frontend (frontend/)
```bash
cd frontend && npm run dev    # Runs on http://localhost:3002
cd frontend && npm run build
cd frontend && npm run lint   # ESLint
```

### Environment Setup
Copy `server/.env.example` → `server/.env` and fill in:
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — AWS Bedrock LLM
- `MONGODB` — MongoDB Atlas connection string
- `TAVILY_API_KEY` — Web search
- `GEMINI_API_KEY` — Vector embeddings
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram
- `TWILIO_*` — WhatsApp
- `DISCORD_WEBHOOK_URL` — Discord
- `GOOGLE_*` — Gmail OAuth2

---

## Architecture Overview

### Monorepo Structure
```
Agent-Matrix/
├── server/          # Node.js + Express + LangGraph (ES Modules, type: "module")
│   └── src/
│       ├── index.js          # Entry: Express + MongoDB + cron + Telegram bot startup
│       ├── agents/           # 10 AI agent node functions
│       ├── workflows/
│       │   ├── graph.js      # StateGraph definition (all nodes + edges)
│       │   └── runner.js     # Workflow runners + SSE event bus
│       ├── state/graphState.js   # Zod-based LangGraph state schema
│       ├── controllers/      # Express route handlers
│       ├── routes/           # Route registration (all mounted under /api)
│       ├── models/           # Mongoose schemas (8 models)
│       ├── services/         # cronService, ragService, gmailService, costTracker
│       └── middleware/tenant.js  # Multi-tenant API key injection
└── frontend/        # Next.js 14 App Router (TypeScript)
    └── src/
        ├── app/page.tsx      # Root layout: Sidebar + main view + RightPanel
        ├── components/       # 27 TSX components organized by feature
        └── store/agent-store.ts  # Zustand store (single source of truth)
```

### LangGraph Workflow (Hub-and-Spoke)
All agents return to Orchestrator after each step. The graph is defined in [server/src/workflows/graph.js](server/src/workflows/graph.js):
```
START → orchestrator
         ↳ scraper → orchestrator
         ↳ analyzer → orchestrator
         ↳ writer ↔ critic (revision loop, max 5 iterations)
         ↳ architect → orchestrator
         ↳ fileSaver → orchestrator
         ⛔ [interruptBefore: human_approval] ← graph pauses here
         ↳ publisher → orchestrator → END
```
- Routing decisions live entirely in `orchestratorNode` (sets `state.nextAgent`)
- `interruptBefore: ["human_approval"]` pauses execution; `/api/approve` resumes it
- After approval, `runPublishWorkflow` calls `publisherNode` directly (bypasses graph)

### SSE Real-time Streaming
`runner.js` exports `agentEventBus` (EventEmitter) and `emitToThread(threadId, event)`. Events are **buffered** if the frontend SSE connection (`GET /api/events/:threadId`) hasn't opened yet. The frontend `agent-store.ts` opens the SSE connection on workflow start and processes `agent_activation` / `workflow_complete` / `workflow_error` events.

### HITL (Human-in-the-Loop) Flow
1. `fileSaver` saves artifact → sets `state.fileSaved = true`
2. Graph hits `interruptBefore: ["human_approval"]` → pauses
3. `runner.js` emits `workflow_complete` SSE event with report content
4. Frontend opens right panel with `ReportViewer`; user clicks Authorize or Reject
5. `POST /api/approve` resumes the graph thread via `approvalController`

### Two-Layer Report Content Delivery
- **Live workflow**: `pendingContent` set in Zustand store from SSE `workflow_complete` event
- **After state reset / page reload**: `ReportViewer` auto-fetches from `GET /api/artifact/:threadId` when `pendingContent` is empty; syncs `threadId` + `workflowPhase` back to store

### LLM Model (AWS Bedrock Cross-Region EU)
All agents use: `eu.anthropic.claude-sonnet-4-5-20250929-v1:0`
Vector embeddings: Google Gemini `gemini-embedding-001` (1536-dim, free tier)

---

## Critical Gotchas

**LangGraph node signature**: Nodes receive `(state, config)` — `config` must be explicitly declared as the second parameter if you reference `config?.configurable` inside the function. Missing `config` causes `ReferenceError: config is not defined` at runtime.

**Report model has no `clientId`**: `fileAgent.js` saves `Report` documents without a `clientId` field. Never filter `Report.exists({ threadId, clientId })` — use `Report.exists({ threadId })` only.

**ES Modules throughout server**: `server/package.json` has `"type": "module"`. Use `import`/`export` syntax everywhere — `require()` will fail.

**Revision loop guard**: `orchestrator.js` checks `state.revisionCount >= 5` as a hard circuit breaker. Always increment `revisionCount` in the writer node and check it in orchestrator to prevent infinite Writer ↔ Critic loops.

**MongoDB vector index**: The `Knowledge` collection requires a MongoDB Atlas vector search index named `vector_index` with `numDimensions: 3072` for Gemini embeddings. If RAG search fails, verify this index exists in Atlas.

---

# Project Overview
**Project Name:** AI Orchestra (Agent-Matrix) & Cyber-Nexus UI

This project is a highly autonomous, Multi-Agent AI System designed to act as a complete digital company. It is NOT a simple chatbot. The system consists of two main environments:
1. **Backend (The Brain):** A Node.js server running a 9-Agent Swarm orchestrated by LangGraph. Agents (CEO, CTO, Scraper, Critic, Publisher, etc.) can search the web autonomously, write code/reports, and trigger internal R&D loops via cron jobs.
2. **Frontend (The Command Center):** A Next.js 14 based "Cyber-Nexus" UI. It functions as an OSINT-style, futuristic dashboard where a Human-in-the-Loop (HITL) monitors the agents' live status, reads generated artifacts (Markdown), and provides final Authorization or Rejection.



## Tech Stack

**Backend (AI Matrix):**
- **Runtime & Framework:** Node.js (v18+), Express.js
- **AI Orchestration:** LangGraph (State Graph Architecture), LangChain
- **LLM Providers:** Anthropic (Claude 3.5 Sonnet), OpenAI
- **Tools & APIs:** Tavily Search API (Web scraping), node-cron (Proactive R&D engine)
- **Database:** MongoDB Atlas

**Frontend (Cyber-Nexus UI):**
- **Framework:** Next.js 14 (App Router), React
- **Styling & UI:** TailwindCSS, Framer Motion (for animations), Glassmorphism effects
- **Data Rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
- **Client-Server Comm:** Fetch API, Server-Sent Events (SSE) or WebSockets for live agent status

---

# Coding Rules

**1. General Engineering Standards:**
- Write clean, modular, and self-documenting code.
- **Strict TypeScript:** Never use the `any` type. Define clear interfaces for all AI responses and State objects.
- **Error Handling:** Implement defensive programming. Always wrap API calls and AI invocations in `try/catch` blocks. Fail gracefully and log errors to the terminal.

**2. Backend & LangGraph Rules:**
- **NO INFINITE LOOPS:** All cyclic LangGraph routes (e.g., Writer -> Critic -> Writer) MUST have a hardcoded `revision_count` limit. If the limit is reached, force-route the graph to the HITL (Human) node or end the process.
- **Agent Modularity:** Each agent must have a single responsibility (e.g., Scraper only scrapes, CTO only architectures).
- **HITL Gate:** The system must pause and wait for the `/api/approve` endpoint before executing the Publisher/Webhook node.

**3. Frontend (UI/UX) Design Rules:**
- **Theme:** OSINT / Hacker Command Center / SpaceX Mission Control. 
- **Colors:** Vantablack (`bg-black`) background. Accents must be Neon Green, Cyan, and Alert Amber/Red. NO generic white SaaS cards.
- **Animations:** Use `framer-motion` and Tailwind pulse effects for active AI nodes. The UI must feel "alive" when the AI is processing.
- **Modals:** Use heavy backdrop-blur (Glassmorphism) for the Authorization Gate.

## Memory

**1. LangGraph State (Backend Memory):**
- State is managed via LangGraph's `StateGraph`. 
- The schema includes: `messages` (array), `active_agent` (string), `scraped_data` (string), `blueprint_artifact` (string), `revision_count` (number), and `is_approved` (boolean/null).
- Persistence is handled via MongoDB and LangGraph Checkpointers to ensure threads can be paused and resumed seamlessly.

**2. Frontend Memory (Client State):**
- The browser maintains active `threadId` via React `useState` to link user actions (Approval/Rejection) to the correct backend process.
- Live terminal logs and active node highlights are driven by ephemeral state updated via SSE/WebSockets from the backend.
