"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type LogEntry = {
    id: string;
    timestamp: string;
    agent: string;
    message: string;
    status: "INFO" | "WARN" | "ERROR" | "SUCCESS";
};

// İlk render için örnek loglar
const MOCK_LOGS: LogEntry[] = [
    { id: "1", timestamp: "08:00:01", agent: "SYSTEM", message: "Proactive Motor Initiated.", status: "INFO" },
    { id: "2", timestamp: "08:00:03", agent: "RESEARCHER", message: "Connecting to Tavily API...", status: "INFO" },
    { id: "3", timestamp: "08:00:05", agent: "RESEARCHER", message: "Data extraction complete.", status: "SUCCESS" },
];

export const TerminalLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Yeni log geldiğinde aşağı kaydır
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    // Simülasyon: Rastgele log üretici
    useEffect(() => {
        const interval = setInterval(() => {
            const statuses: ("INFO" | "WARN" | "SUCCESS" | "ERROR")[] = ["INFO", "INFO", "SUCCESS", "WARN", "INFO", "ERROR"];
            const newLog: LogEntry = {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toLocaleTimeString("tr-TR", { hour12: false }),
                agent: ["CEO", "CTO", "ANALYST", "QA", "PUBLISHER"][Math.floor(Math.random() * 5)],
                message: "Processing data stream... " + Math.random().toString(36).substring(2, 8).toUpperCase(),
                status: statuses[Math.floor(Math.random() * statuses.length)],
            };
            setLogs((prev) => [...prev.slice(-49), newLog]); // En fazla 50 log tut
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: LogEntry["status"]) => {
        switch (status) {
            case "INFO": return "text-neon-blue";
            case "WARN": return "text-cyber-amber";
            case "ERROR": return "text-red-500 text-shadow-red";
            case "SUCCESS": return "text-neon-green";
            default: return "text-white";
        }
    };

    return (
        <div className="glass-panel w-full h-full rounded-md border border-white/10 flex flex-col p-4 relative overflow-hidden">
            {/* Glitch Overlay Scanline */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 z-10 animate-scanline pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h2 className="neon-text-blue font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                    Terminal Logs
                </h2>
                <span className="text-xs font-mono text-white/40">SYS_UPTIME: 99.9%</span>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide font-mono text-[10px] leading-relaxed flex flex-col gap-2"
            >
                {logs.map((log) => (
                    <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-2 ${getStatusColor(log.status)}`}
                    >
                        <span className="opacity-50 shrink-0">[{log.timestamp}]</span>
                        <span className="font-bold shrink-0">&lt;{log.agent}&gt;</span>
                        <span className="break-words opacity-90">{log.message}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
