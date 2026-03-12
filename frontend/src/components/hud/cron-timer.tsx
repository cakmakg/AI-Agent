"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Timer } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

export const CronTimer = () => {
    const { cronSecondsLeft, setCronSeconds, forceRdScan, workflowPhase } = useAgentStore();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            useAgentStore.setState((state) => {
                const next = state.cronSecondsLeft - 1;
                if (next <= 0) {
                    return { cronSecondsLeft: 0 };
                }
                return { cronSecondsLeft: next };
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleForce = useCallback(() => {
        setCronSeconds(120);
        forceRdScan();
    }, [setCronSeconds, forceRdScan]);

    const minutes = Math.floor(cronSecondsLeft / 60);
    const seconds = cronSecondsLeft % 60;
    const isUrgent = cronSecondsLeft <= 15;

    return (
        <div className="glass-panel rounded-md border border-white/8 p-3 flex items-center gap-3 shrink-0">
            <Timer size={14} className={`shrink-0 ${isUrgent ? "text-alert-red animate-pulse" : "text-cyber-amber"}`} />

            <div className="flex-1 min-w-0">
                <div className="text-[8px] font-mono text-white/30 uppercase tracking-wider mb-0.5">
                    R&D Cycle
                </div>
                <div className={`font-mono text-sm font-bold tracking-widest ${isUrgent ? "neon-text-red" : "neon-text-amber"}`}>
                    T-{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleForce}
                disabled={workflowPhase !== "IDLE"}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[8px] font-bold uppercase tracking-wider
          border border-cyber-amber/30 text-cyber-amber hover:bg-cyber-amber/10 hover:border-cyber-amber/50
          disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                id="force-rd-scan-btn"
                aria-label="Force R&D scan"
            >
                <Zap size={10} /> Force Scan
            </motion.button>
        </div>
    );
};
