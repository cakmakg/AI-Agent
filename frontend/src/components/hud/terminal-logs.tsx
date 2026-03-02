"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAgentStore, LogEntry } from "@/store/agent-store";

const LEVEL_CONFIG: Record<LogEntry["level"], { cls: string; prefix: string }> = {
    INFO: { cls: "text-neon-blue", prefix: "INF" },
    WARN: { cls: "neon-text-amber", prefix: "WRN" },
    ERROR: { cls: "neon-text-red", prefix: "ERR" },
    SUCCESS: { cls: "neon-text-green", prefix: "OK!" },
    CRITICAL: { cls: "neon-text-red font-bold", prefix: "!!!" },
};

const AGENT_COLORS: Record<string, string> = {
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

const getTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", { hour12: false }) + "." + String(now.getMilliseconds()).padStart(3, "0");
};

export const TerminalLogs = () => {
    const logs = useAgentStore((s) => s.logs);
    const addLog = useAgentStore((s) => s.addLog);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bootedRef = useRef(false);
    const [systemLoad, setSystemLoad] = useState("--.-");

    useEffect(() => {
        setSystemLoad((70 + Math.random() * 25).toFixed(1));
    }, []);

    // Boot sequence
    useEffect(() => {
        if (bootedRef.current) return;
        bootedRef.current = true;

        const bootMessages: Omit<LogEntry, "id">[] = [
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "AI Orchestra v2.0.0 — Kernel Loaded", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Initializing 9-Agent Swarm Topology...", level: "INFO" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "LangGraph State Machine: ONLINE", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Tavily Search API: CONNECTED", level: "SUCCESS" },
            { timestamp: getTimestamp(), agent: "SYSTEM", message: "Human-in-the-Loop Gate: ARMED", level: "WARN" },
            { timestamp: getTimestamp(), agent: "CEO", message: "Orchestrator online. Awaiting directives...", level: "SUCCESS" },
        ];

        let i = 0;
        const bootInterval = setInterval(() => {
            if (i < bootMessages.length) {
                addLog(bootMessages[i]);
                i++;
            } else {
                clearInterval(bootInterval);
            }
        }, 350);

        return () => clearInterval(bootInterval);
    }, [addLog]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs]);

    const getAgentColor = useCallback((agent: string): string => AGENT_COLORS[agent] ?? "text-white/50", []);

    return (
        <div className="glass-panel w-full h-full rounded-md border border-neon-blue/15 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-neon-blue/30 animate-scanline pointer-events-none z-20" />

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                        <span className="w-[7px] h-[7px] rounded-full bg-alert-red/80" />
                        <span className="w-[7px] h-[7px] rounded-full bg-cyber-amber/80" />
                        <span className="w-[7px] h-[7px] rounded-full bg-neon-green/80" />
                    </div>
                    <span className="neon-text-blue font-mono text-[11px] uppercase tracking-[0.2em] animate-flicker">▸ sys_terminal</span>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono text-white/30">
                    <span>CPU: <span className="text-neon-green">{systemLoad}%</span></span>
                    <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                    <span>LIVE</span>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 font-mono text-[10px] leading-[1.8] flex flex-col">
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
                            <span className={`shrink-0 text-[9px] px-1 py-[1px] rounded-sm bg-white/5 ${config.cls}`}>{config.prefix}</span>
                            <span className={`shrink-0 font-semibold ${getAgentColor(log.agent)}`}>{log.agent.padEnd(9)}</span>
                            <span className="text-white/60 break-words">{log.message}</span>
                        </motion.div>
                    );
                })}
                <div className="flex items-center gap-1 mt-1 text-neon-green/50">
                    <span>▸</span>
                    <span className="w-[6px] h-[14px] bg-neon-green/70 animate-typing-cursor" />
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 text-[8px] font-mono text-white/20 bg-white/[0.01] shrink-0">
                <span>BUFFER: {logs.length}/120</span>
                <span>AGENTS: 9 ONLINE</span>
                <span>PROTOCOL: AES-256</span>
            </div>
        </div>
    );
};
