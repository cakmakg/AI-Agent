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

            if (data.success && data.status === "AWAITING_HUMAN_APPROVAL") {
                // Workflow complete, awaiting HITL approval
                set({
                    threadId: data.threadId,
                    pendingContent: data.pendingContent || "No content available.",
                    workflowPhase: "AWAITING_APPROVAL",
                });

                setAgentStatus("ceo", "SUCCESS");
                setActiveAgent("hitl");
                setAgentStatus("hitl", "ACTIVE");

                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: "Workflow complete. Awaiting HITL authorization.", level: "WARN" });
                addAlert({ message: "MISSION COMPLETE — AWAITING YOUR AUTHORIZATION", type: "warning" });

            } else if (data.success) {
                // Non-approval flow (e.g. INFO classification)
                setAgentStatus("ceo", "SUCCESS");
                setActiveAgent(null);
                setWorkflowPhase("IDLE");
                addLog({ timestamp: getTimestamp(), agent: "SYSTEM", message: `Task classified: ${data.category || "COMPLETED"}`, level: "SUCCESS" });
                addAlert({ message: "TASK PROCESSED SUCCESSFULLY", type: "success" });

            } else {
                throw new Error(data.error || "Unknown backend error");
            }
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
                body: JSON.stringify({ threadId, isApproved: true, feedback: feedback || "", category: "HOT_LEAD" }),
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
                    set({ workflowPhase: "IDLE", threadId: null, pendingContent: null, missionMessage: null });
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
                body: JSON.stringify({ threadId, isApproved: false, feedback, category: "HOT_LEAD" }),
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

    // ── Force R&D Scan ──
    forceRdScan: async () => {
        const { addLog, setAgentStatus, setActiveAgent, addAlert } = get();

        setAgentStatus("radar", "ACTIVE");
        setActiveAgent("radar");
        addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "FORCE R&D SCAN initiated by operator.", level: "WARN" });
        addAlert({ message: "SYSTEM WAKE: R&D PROTOCOL INITIATED", type: "warning" });

        try {
            await fetch("/api/inbox", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Proactive R&D Scan: Analyze latest AI developments from Anthropic, OpenAI, and Google." }),
            });

            addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "R&D scan dispatched to backend.", level: "SUCCESS" });
            setAgentStatus("radar", "SUCCESS");
        } catch {
            setAgentStatus("radar", "ERROR");
            addLog({ timestamp: getTimestamp(), agent: "RADAR", message: "R&D scan failed — backend unreachable.", level: "ERROR" });
        }
    },
}));
