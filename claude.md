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
