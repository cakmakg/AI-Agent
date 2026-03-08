"use client";

import React, { useEffect, useRef } from "react";
import { useAgentStore } from "@/store/agent-store";
import { ChatMessageBubble } from "./chat-message";
import { MissionInput } from "@/components/hud/mission-input";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";

const PHASE_BADGE: Record<string, { label: string; color: string }> = {
    IDLE:              { label: "IDLE",              color: "text-white/50 border-white/15 bg-white/5" },
    DISPATCHING:       { label: "DISPATCHING",       color: "text-neon-blue border-neon-blue/40 bg-neon-blue/10 animate-pulse" },
    RUNNING:           { label: "RUNNING",           color: "text-neon-green border-neon-green/40 bg-neon-green/10 animate-pulse" },
    AWAITING_APPROVAL: { label: "AWAITING APPROVAL", color: "text-cyber-amber border-cyber-amber/50 bg-cyber-amber/10" },
    PUBLISHING:        { label: "PUBLISHING",        color: "text-neon-blue border-neon-blue/40 bg-neon-blue/10 animate-pulse" },
    DELIVERED:         { label: "DELIVERED",         color: "text-neon-green border-neon-green/50 bg-neon-green/10" },
    REVISING:          { label: "REVISING",          color: "text-alert-red border-alert-red/40 bg-alert-red/10 animate-pulse" },
};

export const ChatView = () => {
    const { chatMessages, workflowPhase, setActiveView } = useAgentStore();
    const bottomRef = useRef<HTMLDivElement>(null);
    const badge = PHASE_BADGE[workflowPhase] ?? PHASE_BADGE["IDLE"];

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 shrink-0"
                style={{ background: "rgba(13, 24, 41, 0.9)" }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="font-mono text-[12px] font-bold text-white/85 uppercase tracking-widest">
                        Command Center
                    </span>
                </div>
                <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-styled">
                <AnimatePresence initial={false}>
                    {chatMessages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full gap-5 text-center"
                        >
                            <div className="w-20 h-20 rounded-full border-2 border-neon-blue/25 flex items-center justify-center text-4xl bg-neon-blue/5">
                                ◈
                            </div>
                            <div>
                                <p className="font-mono text-[13px] text-white/55 tracking-wide font-semibold">AI Orchestra — Hazır</p>
                                <p className="font-mono text-[10px] text-white/35 mt-1.5">Aşağıya bir görev girin ve başlayın</p>
                            </div>
                        </motion.div>
                    ) : (
                        chatMessages.map((msg) => (
                            <ChatMessageBubble key={msg.id} message={msg} />
                        ))
                    )}
                </AnimatePresence>

                {/* HITL nudge when awaiting */}
                {workflowPhase === "AWAITING_APPROVAL" && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-4"
                    >
                        <button
                            onClick={() => setActiveView("inbox")}
                            className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-cyber-amber/15 border border-cyber-amber/40
                                       text-cyber-amber font-mono text-[10px] font-bold tracking-wide hover:bg-cyber-amber/25 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        >
                            <Inbox size={12} />
                            Inbox'tan incele ve onayla →
                        </button>
                    </motion.div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-white/10 shrink-0" style={{ background: "rgba(13, 24, 41, 0.9)" }}>
                <MissionInput />
            </div>
        </div>
    );
};
