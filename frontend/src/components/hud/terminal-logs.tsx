"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS" | "CRITICAL";

interface LogEntry {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    level: LogLevel;
}

const AGENT_NAMES = ["CEO", "CTO", "SCRAPER", "ANALYST", "WRITER", "QA", "HITL", "PUBLISHER", "RADAR"] as const;

const REALISTIC_MESSAGES: Record<string, string[]> = {
    CEO: [
        "Routing incoming task to Software Department...",
        "Priority assessment complete → URGENCY: MEDIUM",
        "Delegating research subtask to SCRAPER node",
        "Workflow state: ANALYSIS_PHASE initiated",
        "All department leads acknowledged — swarm active",
    ],
    CTO: [
        "Generating Master Blueprint v3.2.1...",
        "Architecture validation: 47 endpoints mapped",
        "Schema migration plan drafted → awaiting QA",
        "Tech debt scan: 3 critical items flagged",
        "Blueprint export: /output/blueprint_latest.md",
    ],
    SCRAPER: [
        "Tavily API connection established [200 OK]",
        "Crawling target: docs.anthropic.com/changelog",
        "Extracted 2,847 tokens from 12 sources",
        "Rate limit check: 45/100 requests remaining",
        "Data pipeline flush → forwarding to ANALYST",
    ],
    ANALYST: [
        "Processing raw dataset: 2,847 tokens ingested",
        "Sentiment analysis: 89% positive indicators",
        "Strategic correlation matrix generated",
        "Report draft: market_analysis_q1.md [READY]",
        "Anomaly detected in sector 7G → flagging",
    ],
    WRITER: [
        "Content generation: B2B whitepaper mode",
        "Tone calibration: Professional / Technical",
        "Draft v1 complete → 1,200 words generated",
        "SEO optimization pass: 94/100 score",
        "Forwarding to QA for editorial review",
    ],
    QA: [
        "Quality gate initialized — strict mode",
        "Grammar check: 0 errors / 2 suggestions",
        "Fact verification: cross-referencing 8 sources",
        "REJECTED: Section 3 lacks citation depth",
        "APPROVED: Final draft meets quality threshold",
    ],
    HITL: [
        "Human review queue: 1 item pending",
        "Awaiting authorization signal...",
        "Approval timeout: T-minus 300 seconds",
        "Security clearance: LEVEL-4 required",
        "Manual override available via dashboard",
    ],
    PUBLISHER: [
        "Discord Webhook: connection verified",
        "Preparing payload: 3 attachments queued",
        "Delivery channel: #ai-reports (Slack)",
        "Publish status: HOLDING for HITL approval",
        "Batch distribution: 0/3 channels delivered",
    ],
    RADAR: [
        "Proactive scan cycle #847 initiated",
        "Monitoring: OpenAI API changelog [v4.x]",
        "New feature detected: GPT-4o audio mode",
        "Innovation report auto-generated",
        "Next scan scheduled: T+3600 seconds",
    ],
};

const LEVEL_CONFIG: Record<LogLevel, { cls: string; prefix: string }> = {
    INFO: { cls: "text-neon-blue", prefix: "INF" },
    WARN: { cls: "neon-text-amber", prefix: "WRN" },
    ERROR: { cls: "neon-text-red", prefix: "ERR" },
    SUCCESS: { cls: "neon-text-green", prefix: "OK!" },
    CRITICAL: { cls: "neon-text-red font-bold", prefix: "!!!" },
};

const getTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
};

const generateLog = (): LogEntry => {
    const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
    const msgs = REALISTIC_MESSAGES[agent];
    const message = msgs[Math.floor(Math.random() * msgs.length)];
    const levels: LogLevel[] = ["INFO", "INFO", "INFO", "SUCCESS", "WARN", "INFO", "INFO", "SUCCESS"];
    const level = agent === "QA" && message.includes("REJECTED")
        ? "ERROR"
        : levels[Math.floor(Math.random() * levels.length)];

    return {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2),
        timestamp: getTimestamp(),
        agent,
        message,
        level,
    };
};

export const TerminalLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [systemLoad, setSystemLoad] = useState("--.-");

    useEffect(() => {
        setSystemLoad((70 + Math.random() * 25).toFixed(1));
    }, []);

    const bootedRef = useRef(false);

    // Boot sequence (guarded against StrictMode double-mount)
    useEffect(() => {
        if (bootedRef.current) return;
        bootedRef.current = true;

        const bootMessages: Omit<LogEntry, "id">[] = [
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "AI Orchestra v2.0.0 — Kernel Loaded", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Initializing 9-Agent Swarm Topology...", level: "INFO" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "LangGraph State Machine: ONLINE", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Tavily Search API: CONNECTED", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Discord Webhook: STANDBY", level: "INFO" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Human-in-the-Loop Gate: ARMED", level: "WARN" },
            { timestamp: getTimestamp(), agent: "CEO", message: "Orchestrator online. Awaiting directives...", level: "SUCCESS" },
        ];

        let i = 0;
        const bootInterval = setInterval(() => {
            if (i < bootMessages.length) {
                const entry: LogEntry = { ...bootMessages[i], id: `boot-${Date.now()}-${i}` };
                setLogs((prev) => [...prev, entry]);
                i++;
            } else {
                clearInterval(bootInterval);
            }
        }, 400);

        return () => clearInterval(bootInterval);
    }, []);

    // Continuous log stream
    useEffect(() => {
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                setLogs((prev) => [...prev.slice(-80), generateLog()]);
            }, 1800 + Math.random() * 1200);
            return () => clearInterval(interval);
        }, 3500); // Wait for boot sequence

        return () => clearTimeout(timeout);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const getAgentColor = useCallback((agent: string): string => {
        const map: Record<string, string> = {
            SYSTEM: "text-white/70",
            CEO: "text-neon-blue",
            CTO: "text-neon-green",
            SCRAPER: "text-cyber-amber",
            ANALYST: "text-neon-blue",
            WRITER: "text-neon-green",
            QA: "text-cyber-amber",
            HITL: "text-alert-red",
            PUBLISHER: "text-neon-blue",
            RADAR: "text-neon-green",
        };
        return map[agent] ?? "text-white/50";
    }, []);

    return (
        <div className="glass-panel w-full h-full rounded-md border border-neon-blue/15 flex flex-col relative overflow-hidden">
            {/* Scanline Effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-blue/30 animate-scanline pointer-events-none z-20" />

            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                        <span className="w-[7px] h-[7px] rounded-full bg-alert-red/80" />
                        <span className="w-[7px] h-[7px] rounded-full bg-cyber-amber/80" />
                        <span className="w-[7px] h-[7px] rounded-full bg-neon-green/80" />
                    </div>
                    <span className="neon-text-blue font-mono text-[11px] uppercase tracking-[0.2em] animate-flicker">
                        ▸ sys_terminal
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
                    <span>CPU: <span className="text-neon-green">{systemLoad}%</span></span>
                    <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                    <span>LIVE</span>
                </div>
            </div>

            {/* Log Stream */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 font-mono text-[10px] leading-[1.8] flex flex-col"
            >
                {logs.map((log) => {
                    const config = LEVEL_CONFIG[log.level];
                    return (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-baseline gap-1.5 hover:bg-white/[0.02] px-1 rounded-sm"
                        >
                            <span className="text-white/25 shrink-0 select-none">{log.timestamp}</span>
                            <span className={`shrink-0 text-[9px] px-1 py-[1px] rounded-sm bg-white/5 ${config.cls}`}>
                                {config.prefix}
                            </span>
                            <span className={`shrink-0 font-semibold ${getAgentColor(log.agent)}`}>
                                {log.agent.padEnd(9)}
                            </span>
                            <span className="text-white/60 break-words">{log.message}</span>
                        </motion.div>
                    );
                })}
                <div className="flex items-center gap-1 mt-1 text-neon-green/50">
                    <span>▸</span>
                    <span className="w-[6px] h-[14px] bg-neon-green/70 animate-typing-cursor" />
                </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 text-[8px] font-mono text-white/20 bg-white/[0.01] shrink-0">
                <span>BUFFER: {logs.length}/80</span>
                <span>AGENTS: {AGENT_NAMES.length} ONLINE</span>
                <span>PROTOCOL: AES-256</span>
            </div>
        </div>
    );
};
