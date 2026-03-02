"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

export const MissionInput = () => {
    const [input, setInput] = useState("");
    const { sendMission, workflowPhase } = useAgentStore();
    const isDisabled = workflowPhase !== "IDLE" || input.trim().length === 0;
    const isRunning = workflowPhase !== "IDLE";

    const handleSubmit = useCallback(async () => {
        if (isDisabled) return;
        const message = input.trim();
        setInput("");
        await sendMission(message);
    }, [input, isDisabled, sendMission]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="glass-panel border border-neon-blue/15 rounded-md px-4 py-2.5 flex items-center gap-3">
            {/* Status indicator */}
            <div className={`w-2 h-2 rounded-full shrink-0 ${isRunning ? "bg-cyber-amber animate-pulse" : "bg-neon-green"}`} />

            {/* Input */}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isRunning}
                placeholder={isRunning ? "Mission in progress... stand by" : 'Enter mission directive (e.g. "Yeni bir CRM projesi için mimari çiz")'}
                className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-white/80 placeholder:text-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                id="mission-input"
                aria-label="Mission directive input"
            />

            {/* Submit button */}
            <motion.button
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={handleSubmit}
                disabled={isDisabled}
                className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-200
          ${isRunning
                        ? "border border-cyber-amber/30 text-cyber-amber/50 cursor-not-allowed"
                        : isDisabled
                            ? "border border-white/10 text-white/20 cursor-not-allowed"
                            : "border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/70 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                    }`}
                id="initiate-mission-btn"
                aria-label="Initiate mission"
            >
                {isRunning ? (
                    <>
                        <Loader2 size={12} className="animate-spin" /> Processing
                    </>
                ) : (
                    <>
                        <Send size={12} /> Initiate
                    </>
                )}
            </motion.button>
        </div>
    );
};
