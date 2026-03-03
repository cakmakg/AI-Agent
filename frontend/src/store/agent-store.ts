import { create } from "zustand";

// ── Agent Status Types ──
export type AgentStatus = "IDLE" | "THINKING" | "ACTIVE" | "SUCCESS" | "ERROR";

export type AgentId =
    | "ceo"
    | "cto"
    | "scraper"
    | "analyst"
    | "writer"
    | "qa"
    | "hitl"
    | "publisher"
    | "radar";

export type WorkflowPhase =
    | "IDLE"
    | "DISPATCHING"
    | "RUNNING"
    | "AWAITING_APPROVAL"
    | "PUBLISHING"
    | "DELIVERED"
    | "REVISING";

export interface AgentState {
    id: AgentId;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    status: AgentStatus;
}

export interface SystemAlert {
    id: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    timestamp: number;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    level: "INFO" | "WARN" | "ERROR" | "SUCCESS" | "CRITICAL";
}

interface AgentStore {
    // ── Agent States ──
    agents: Record<AgentId, AgentState>;
    activeAgent: AgentId | null;

    // ── Workflow ──
    workflowPhase: WorkflowPhase;
    threadId: string | null;
    pendingContent: string | null;
    missionMessage: string | null;
    missionCategory: "HOT_LEAD" | "SUPPORT" | null;

    // ── Logs & Alerts ──
    logs: LogEntry[];
    alerts: SystemAlert[];

    // ── Cron ──
    cronSecondsLeft: number;

    // ── Actions ──
    setAgentStatus: (id: AgentId, status: AgentStatus) => void;
    setActiveAgent: (id: AgentId | null) => void;
    setWorkflowPhase: (phase: WorkflowPhase) => void;
    addLog: (entry: Omit<LogEntry, "id">) => void;
    addAlert: (alert: Omit<SystemAlert, "id" | "timestamp">) => void;
    removeAlert: (id: string) => void;
    setCronSeconds: (seconds: number) => void;
    resetAllAgents: () => void;

    // ── API Actions ──
    sendMission: (message: string) => Promise<void>;
    approveMission: (feedback?: string) => Promise<void>;
    rejectMission: (feedback: string) => Promise<void>;
    forceRdScan: () => Promise<void>;
    pullLatestArtifact: () => Promise<void>;
}

const getTimestamp = (): string => {
    const now = new Date();
    return (
        now.toLocaleTimeString("en-GB", { hour12: false }) +
        "." +
        String(now.getMilliseconds()).padStart(3, "0")
    );
};

const DEFAULT_AGENTS: Record<AgentId, AgentState> = {
    ceo: { id: "ceo", label: "Orkestra Şefi", shortLabel: "CEO", icon: "👨‍💼", color: "#00f0ff", status: "IDLE" },
    cto: { id: "cto", label: "Baş Mimar", shortLabel: "CTO", icon: "👨‍💻", color: "#39ff14", status: "IDLE" },
    scraper: { id: "scraper", label: "Araştırmacı", shortLabel: "SCR", icon: "🕵️", color: "#ffb000", status: "IDLE" },
    analyst: { id: "analyst", label: "Analist", shortLabel: "ANL", icon: "🧠", color: "#00f0ff", status: "IDLE" },
    writer: { id: "writer", label: "İçerik Yön.", shortLabel: "WRT", icon: "✍️", color: "#39ff14", status: "IDLE" },
    qa: { id: "qa", label: "Eleştirmen", shortLabel: "QA", icon: "🧐", color: "#ffb000", status: "IDLE" },
    hitl: { id: "hitl", label: "İnsan Yargıç", shortLabel: "HITL", icon: "👨‍⚖️", color: "#ff2d55", status: "IDLE" },
    publisher: { id: "publisher", label: "Dağıtımcı", shortLabel: "PUB", icon: "📢", color: "#00f0ff", status: "IDLE" },
    radar: { id: "radar", label: "Ar-Ge Radar", shortLabel: "RDR", icon: "🔬", color: "#39ff14", status: "IDLE" },
};

export const useAgentStore = create<AgentStore>((set, get) => ({
    agents: { ...DEFAULT_AGENTS },
    activeAgent: null,
    workflowPhase: "IDLE",
    threadId: null,
    pendingContent: null,
    missionMessage: null,
    missionCategory: null,
    logs: [],
    alerts: [],
    cronSecondsLeft: 120,

    setAgentStatus: (id, status) =>
        set((state) => ({
            agents: { ...state.agents, [id]: { ...state.agents[id], status } },
        })),

    setActiveAgent: (id) => set({ activeAgent: id }),

    setWorkflowPhase: (phase) => set({ workflowPhase: phase }),

    addLog: (entry) =>
        set((state) => ({
            logs: [...state.logs.slice(-120), { ...entry, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }],
        })),

    addAlert: (alert) => {
        const id = `alert-${Date.now()}`;
        set((state) => ({
            alerts: [...state.alerts, { ...alert, id, timestamp: Date.now() }],
        }));
        // Auto-dismiss after 5 seconds
        setTimeout(() => get().removeAlert(id), 5000);
    },

    removeAlert: (id) =>
        set((state) => ({
            alerts: state.alerts.filter((a) => a.id !== id),
        })),

    setCronSeconds: (seconds) => set({ cronSecondsLeft: seconds }),

    resetAllAgents: () =>
        set({
            agents: { ...DEFAULT_AGENTS },
            activeAgent: null,
        }),

    // ── Send Mission to Backend ──
    sendMission: async (message: string) => {
        const { addLog, setAgentStatus, setActiveAgent, setWorkflowPhase, addAlert } = get();
        set({ missionMessage: message, workflowPhase: "DISPATCHING" });

        addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `Mission received: "${message.slice(0, 60)}..."`, level: "INFO" });
        addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Dispatching to AI Orchestra backend...", level: "INFO" });

        setAgentStatus("ceo", "THINKING");
        setActiveAgent("ceo");

        try {
            setWorkflowPhase("RUNNING");
            addLog({ timestamp: getTimestamp(), agent: "CEO", message: "Orchestrator analyzing request...", level: "INFO" });

            const res = await fetch("/api/inbox", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = await res.json();

            // SPAM / OTHER
            if (data.status === "IGNORED") {
                setAgentStatus("ceo", "SUCCESS");
                setWorkflowPhase("IDLE");
                setActiveAgent(null);
                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Message filtered: SPAM/OTHER", level: "WARN" });
                addAlert({ message: "MESSAGE FILTERED: SPAM/OTHER", type: "warning" });
                return;
            }

            // DESTEK TALEBİ — anlık dönüş, SSE yok
            if (data.status === "AWAITING_HUMAN_APPROVAL_SUPPORT") {
                set({
                    threadId: data.threadId,
                    pendingContent: data.pendingContent || "No content available.",
                    workflowPhase: "AWAITING_APPROVAL",
                    missionCategory: "SUPPORT",
                });
                setAgentStatus("ceo", "SUCCESS");
                setAgentStatus("hitl", "ACTIVE");
                setActiveAgent("hitl");
                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Support request — HITL gate armed.", level: "WARN" });
                addAlert({ message: "SUPPORT REQUEST — AWAITING AUTHORIZATION", type: "warning" });
                return;
            }

            // HOT_LEAD — SSE ile gerçek zamanlı ajan takibi
            if (data.status === "PROCESSING" && data.threadId) {
                set({ threadId: data.threadId, missionCategory: "HOT_LEAD" });
                addLog({ timestamp: getTimestamp(), agent: "CEO", message: "Workflow started. Tracking agents via SSE...", level: "INFO" });

                let previousAgent: AgentId | null = "ceo";
                const eventSource = new EventSource(`/api/events/${data.threadId}`);

                const agentLabels: Record<string, string> = {
                    ceo: "Orchestrator routing...",
                    scraper: "Connecting to Global Network... Fetching data...",
                    analyst: "Processing data blocks...",
                    writer: "Composing B2B content...",
                    qa: "Scanning output for errors...",
                    cto: "Generating architecture blueprint...",
                    hitl: "HITL gate armed. Awaiting authorization.",
                    publisher: "Initiating payload delivery...",
                    radar: "R&D scan in progress...",
                };

                eventSource.onmessage = (e: MessageEvent) => {
                    const event = JSON.parse(e.data) as {
                        type: string;
                        agent?: string;
                        status?: string;
                        pendingContent?: string;
                        message?: string;
                    };

                    if (event.type === "agent_active" && event.agent) {
                        const agentId = event.agent as AgentId;
                        if (previousAgent && previousAgent !== agentId && previousAgent !== "ceo") {
                            get().setAgentStatus(previousAgent, "SUCCESS");
                        }
                        get().setAgentStatus(agentId, "ACTIVE");
                        get().setActiveAgent(agentId);
                        addLog({
                            timestamp: getTimestamp(),
                            agent: agentId.toUpperCase(),
                            message: agentLabels[agentId] ?? "Agent activated",
                            level: "INFO",
                        });
                        previousAgent = agentId;
                    }

                    // ── __interrupt__ geldiğinde: spinner dur, modal aç ──
                    if (event.type === "interrupt" || event.agent === "hitl") {
                        // Bu event zaten agent_active olarak gelecek (backend düzeltildi)
                        // ama ek güvence olarak burada da kontrol ediyoruz
                    }

                    if (event.type === "workflow_complete") {
                        eventSource.close();
                        if (event.status === "AWAITING_HUMAN_APPROVAL") {
                            if (previousAgent && previousAgent !== "ceo") {
                                get().setAgentStatus(previousAgent, "SUCCESS");
                            }
                            get().setAgentStatus("hitl", "ACTIVE");
                            get().setActiveAgent("hitl");

                            const content = event.pendingContent?.trim();

                            if (content) {
                                // İçerik SSE ile geldi — direkt kullan
                                set({ pendingContent: content, workflowPhase: "AWAITING_APPROVAL" });
                                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Workflow complete. Awaiting HITL authorization.", level: "WARN" });
                                addAlert({ message: "MISSION COMPLETE — AWAITING YOUR AUTHORIZATION", type: "warning" });
                            } else {
                                // İçerik boş — MongoDB'den çek (CTO/architect akışları)
                                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Workflow complete. Fetching artifact from MongoDB...", level: "WARN" });
                                const currentThreadId = get().threadId;
                                const url = currentThreadId
                                    ? `/api/artifact/${currentThreadId}`
                                    : `/api/artifact/latest`;

                                fetch(url)
                                    .then((r) => r.json())
                                    .then((artifact) => {
                                        const fetched = artifact.content?.trim() || "*(İçerik hazır — yeniden yükleyin)*";
                                        set({ pendingContent: fetched, workflowPhase: "AWAITING_APPROVAL" });
                                        addAlert({ message: "MISSION COMPLETE — AWAITING YOUR AUTHORIZATION", type: "warning" });
                                    })
                                    .catch(() => {
                                        set({ pendingContent: "*(Blueprint hazır — Pull Intel ile yükleyin)*", workflowPhase: "AWAITING_APPROVAL" });
                                        addAlert({ message: "MISSION COMPLETE — AWAITING YOUR AUTHORIZATION", type: "warning" });
                                    });
                            }
                        }
                    }

                    if (event.type === "error") {
                        eventSource.close();
                        const failedAgent = (previousAgent ?? "ceo") as AgentId;
                        get().setAgentStatus(failedAgent, "ERROR");
                        get().setWorkflowPhase("IDLE");
                        get().setActiveAgent(null);
                        addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `ERROR: ${event.message}`, level: "ERROR" });
                        addAlert({ message: `MISSION FAILED: ${event.message}`, type: "error" });
                    }
                };

                eventSource.onerror = () => {
                    eventSource.close();
                    get().setWorkflowPhase("IDLE");
                    get().setActiveAgent(null);
                    addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "SSE connection lost.", level: "ERROR" });
                    addAlert({ message: "SSE CONNECTION LOST — Check backend", type: "error" });
                };

                return; // EventSource geri kalanı halleder
            }

            // Beklenmeyen yanıt
            throw new Error(data.error || "Unexpected backend response");

        } catch (error) {
            setAgentStatus("ceo", "ERROR");
            setWorkflowPhase("IDLE");
            setActiveAgent(null);
            const errMsg = error instanceof Error ? error.message : "Connection failed";
            addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `ERROR: ${errMsg}`, level: "ERROR" });
            addAlert({ message: `MISSION FAILED: ${errMsg}`, type: "error" });
        }
    },

    // ── Approve Mission ──
    approveMission: async (feedback?: string) => {
        const { threadId, addLog, setAgentStatus, setActiveAgent, setWorkflowPhase, addAlert } = get();
        if (!threadId) return;

        setWorkflowPhase("PUBLISHING");
        setAgentStatus("hitl", "SUCCESS");
        setAgentStatus("publisher", "ACTIVE");
        setActiveAgent("publisher");

        addLog({ timestamp: getTimestamp(), agent: "HITL", message: `AUTHORIZED${feedback ? ` — Note: "${feedback.slice(0, 50)}"` : ""}`, level: "SUCCESS" });
        addLog({ timestamp: getTimestamp(), agent: "PUBLISHER", message: "Initiating payload delivery sequence...", level: "INFO" });

        try {
            const res = await fetch("/api/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    isApproved: true,
                    feedback: feedback || "",
                    category: get().missionCategory === "SUPPORT" ? "SUPPORT_PRICING" : "HOT_LEAD",
                }),
            });

            const data = await res.json();

            if (data.success) {
                setAgentStatus("publisher", "SUCCESS");
                setWorkflowPhase("DELIVERED");
                addLog({ timestamp: getTimestamp(), agent: "PUBLISHER", message: "PAYLOAD DELIVERED to external channels.", level: "SUCCESS" });
                addAlert({ message: "PAYLOAD DELIVERED — TRANSMISSION COMPLETE", type: "success" });

                // Reset after 4 seconds
                setTimeout(() => {
                    get().resetAllAgents();
                    set({ workflowPhase: "IDLE", threadId: null, pendingContent: null, missionMessage: null, missionCategory: null });
                    get().setActiveAgent(null);
                }, 4000);
            } else {
                throw new Error(data.error || "Approval failed");
            }
        } catch (error) {
            setAgentStatus("publisher", "ERROR");
            const errMsg = error instanceof Error ? error.message : "Delivery failed";
            addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `PUBLISH ERROR: ${errMsg}`, level: "ERROR" });
            addAlert({ message: `DELIVERY FAILED: ${errMsg}`, type: "error" });
        }
    },

    // ── Reject Mission ──
    rejectMission: async (feedback: string) => {
        const { threadId, addLog, setAgentStatus, setActiveAgent, setWorkflowPhase, addAlert } = get();
        if (!threadId) return;

        setWorkflowPhase("REVISING");
        setAgentStatus("hitl", "ERROR");
        setActiveAgent("ceo");
        setAgentStatus("ceo", "THINKING");

        addLog({ timestamp: getTimestamp(), agent: "HITL", message: `OVERRIDDEN — Reason: "${feedback.slice(0, 80)}"`, level: "ERROR" });
        addLog({ timestamp: getTimestamp(), agent: "CEO", message: "Revision cycle initiated. Re-routing workflow...", level: "WARN" });
        addAlert({ message: "OVERRIDE — REVISION CYCLE INITIATED", type: "error" });

        try {
            const res = await fetch("/api/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    threadId,
                    isApproved: false,
                    feedback,
                    category: get().missionCategory === "SUPPORT" ? "SUPPORT_PRICING" : "HOT_LEAD",
                }),
            });

            const data = await res.json();

            if (data.success && data.status === "REVISED") {
                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Revision complete. New output pending review.", level: "INFO" });
                setAgentStatus("ceo", "SUCCESS");
                setWorkflowPhase("AWAITING_APPROVAL");
                setActiveAgent("hitl");
                setAgentStatus("hitl", "ACTIVE");
                addAlert({ message: "REVISION COMPLETE — RE-REVIEW REQUIRED", type: "warning" });
            }
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Revision failed";
            addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `REVISION ERROR: ${errMsg}`, level: "ERROR" });
            addAlert({ message: `REVISION FAILED: ${errMsg}`, type: "error" });
        }
    },

    // ── Pull Latest Intel from MongoDB ──
    pullLatestArtifact: async () => {
        const { threadId, addLog, addAlert } = get();
        const url = threadId ? `/api/artifact/${threadId}` : `/api/artifact/latest`;
        try {
            const res = await fetch(url);
            if (res.status === 404) {
                addAlert({ message: "NO PENDING INTEL — System is still processing", type: "warning" });
                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Intel pull: no pending reports found in MongoDB.", level: "WARN" });
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Pull failed");
            // Update store with fetched artifact
            set({
                pendingContent: data.content,
                workflowPhase: "AWAITING_APPROVAL",
                ...(data.threadId && !threadId ? { threadId: data.threadId } : {}),
            });
            addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `Intel acquired from MongoDB — task: "${String(data.task ?? "").slice(0, 60)}..."`, level: "SUCCESS" });
            addAlert({ message: "INTEL ACQUIRED — ARTIFACT LOADED FROM DATABASE", type: "success" });
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Pull failed";
            addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `Intel pull failed: ${errMsg}`, level: "ERROR" });
            addAlert({ message: `INTEL PULL FAILED: ${errMsg}`, type: "error" });
        }
    },

    // ── Force R&D Scan ──
    forceRdScan: async () => {
        const { addLog, setAgentStatus, setActiveAgent, setWorkflowPhase, addAlert } = get();

        // Guard: aktif bir workflow varsa başlatma
        if (get().workflowPhase !== "IDLE") {
            addAlert({ message: "WORKFLOW ACTIVE — R&D scan queued after completion", type: "warning" });
            return;
        }

        setAgentStatus("radar", "ACTIVE");
        setActiveAgent("radar");
        set({ workflowPhase: "RUNNING" });
        addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "INNOVATION RADAR initiated — scanning Anthropic & OpenAI feeds...", level: "WARN" });
        addAlert({ message: "R&D PROTOCOL ACTIVATED — SCANNING AI LANDSCAPE", type: "warning" });

        try {
            const res = await fetch("/api/rnd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (!data.success || data.status !== "PROCESSING" || !data.threadId) {
                throw new Error(data.error || "Unexpected R&D response");
            }

            set({ threadId: data.threadId });
            addLog({ timestamp: getTimestamp(), agent: "RADAR", message: `R&D workflow started — threadId: ${data.threadId}`, level: "INFO" });

            // ── SSE: HOT_LEAD akışıyla aynı pattern ──
            let previousAgent: AgentId | null = "radar";
            const agentLabels: Record<string, string> = {
                ceo: "Orchestrator routing R&D mission...",
                scraper: "Tapping into Anthropic & OpenAI news feeds...",
                analyst: "Processing AI landscape data...",
                writer: "Composing innovation summary...",
                qa: "Quality check on R&D output...",
                cto: "Generating integration blueprint...",
                hitl: "R&D blueprint ready — awaiting authorization.",
                publisher: "Dispatching R&D report...",
                radar: "INNOVATION_RADAR active — live feed connected.",
            };

            const eventSource = new EventSource(`/api/events/${data.threadId}`);

            eventSource.onmessage = (e: MessageEvent) => {
                const event = JSON.parse(e.data) as {
                    type: string;
                    agent?: string;
                    status?: string;
                    pendingContent?: string;
                    message?: string;
                };

                if (event.type === "agent_active" && event.agent) {
                    const agentId = event.agent as AgentId;
                    if (previousAgent && previousAgent !== agentId && previousAgent !== "radar") {
                        get().setAgentStatus(previousAgent, "SUCCESS");
                    }
                    get().setAgentStatus(agentId, "ACTIVE");
                    get().setActiveAgent(agentId);
                    addLog({
                        timestamp: getTimestamp(),
                        agent: agentId.toUpperCase(),
                        message: agentLabels[agentId] ?? "R&D agent activated",
                        level: "INFO",
                    });
                    previousAgent = agentId;
                }

                if (event.type === "workflow_complete") {
                    eventSource.close();
                    if (event.status === "AWAITING_HUMAN_APPROVAL") {
                        if (previousAgent && previousAgent !== "radar") {
                            get().setAgentStatus(previousAgent, "SUCCESS");
                        }
                        set({
                            pendingContent: event.pendingContent || "No R&D content available.",
                            workflowPhase: "AWAITING_APPROVAL",
                        });
                        get().setAgentStatus("hitl", "ACTIVE");
                        get().setActiveAgent("hitl");
                        get().setAgentStatus("radar", "SUCCESS");
                        addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "R&D SCAN COMPLETE — Innovation blueprint ready for authorization.", level: "SUCCESS" });
                        addAlert({ message: "R&D COMPLETE — BLUEPRINT AWAITING YOUR AUTHORIZATION", type: "success" });
                    }
                }

                if (event.type === "error") {
                    eventSource.close();
                    get().setAgentStatus("radar", "ERROR");
                    setWorkflowPhase("IDLE");
                    setActiveAgent(null);
                    addLog({ timestamp: getTimestamp(), agent: "RADAR", message: `R&D ERROR: ${event.message}`, level: "ERROR" });
                    addAlert({ message: `R&D SCAN FAILED: ${event.message}`, type: "error" });
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                get().setAgentStatus("radar", "ERROR");
                setWorkflowPhase("IDLE");
                setActiveAgent(null);
                addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "R&D SSE connection lost.", level: "ERROR" });
                addAlert({ message: "R&D SSE LOST — Check backend", type: "error" });
            };

        } catch (error) {
            setAgentStatus("radar", "ERROR");
            setWorkflowPhase("IDLE");
            setActiveAgent(null);
            const errMsg = error instanceof Error ? error.message : "R&D scan failed";
            addLog({ timestamp: getTimestamp(), agent: "RADAR", message: `R&D FAILED: ${errMsg}`, level: "ERROR" });
            addAlert({ message: `R&D SCAN FAILED: ${errMsg}`, type: "error" });
        }
    },
}));
