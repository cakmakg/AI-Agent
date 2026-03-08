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
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 border transition-all duration-200"
            style={{
                background: "rgba(20, 30, 55, 0.9)",
                borderColor: isRunning ? "rgba(251,191,36,0.35)" : "rgba(56,189,248,0.25)",
                boxShadow: isRunning
                    ? "0 0 20px rgba(251,191,36,0.08)"
                    : "0 0 20px rgba(56,189,248,0.08)",
            }}>
            {/* Status indicator */}
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRunning ? "bg-cyber-amber animate-pulse" : "bg-neon-green"}`} />

            {/* Input */}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isRunning}
                placeholder={isRunning ? "Görev yürütülüyor... lütfen bekleyin" : 'Görev girin — ör: "Yeni bir CRM projesi için mimari çiz"'}
                className="flex-1 bg-transparent border-none outline-none font-mono text-[12px] text-white/90 placeholder:text-white/35 disabled:opacity-50 disabled:cursor-not-allowed"
                id="mission-input"
                aria-label="Mission directive input"
            />

            {/* Submit button */}
            <motion.button
                whileHover={!isDisabled ? { scale: 1.04 } : {}}
                whileTap={!isDisabled ? { scale: 0.96 } : {}}
                onClick={handleSubmit}
                disabled={isDisabled}
                className={`shrink-0 flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-all duration-200
          ${isRunning
                        ? "border border-cyber-amber/35 text-cyber-amber/60 bg-cyber-amber/8 cursor-not-allowed"
                        : isDisabled
                            ? "border border-white/15 text-white/30 cursor-not-allowed"
                            : "border border-neon-blue/50 text-neon-blue bg-neon-blue/10 hover:bg-neon-blue/20 hover:border-neon-blue/70 hover:shadow-[0_0_16px_rgba(56,189,248,0.2)]"
                    }`}
                id="initiate-mission-btn"
                aria-label="Initiate mission"
            >
                {isRunning ? (
                    <>
                        <Loader2 size={13} className="animate-spin" /> İşleniyor
                    </>
                ) : (
                    <>
                        <Send size={13} /> Başlat
                    </>
                )}
            </motion.button>
        </div>
    );
};
