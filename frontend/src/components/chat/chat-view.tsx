"use client";

import React, { useEffect, useRef } from "react";
import { useAgentStore } from "@/store/agent-store";
import { ChatMessageBubble } from "./chat-message";
import { MissionInput } from "@/components/hud/mission-input";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";

const PHASE_BADGE: Record<string, { label: string; color: string }> = {
    IDLE:              { label: "IDLE",              color: "text-white/30 border-white/10" },
    DISPATCHING:       { label: "DISPATCHING",       color: "text-neon-blue border-neon-blue/30 animate-pulse" },
    RUNNING:           { label: "RUNNING",           color: "text-neon-green border-neon-green/30 animate-pulse" },
    AWAITING_APPROVAL: { label: "AWAITING APPROVAL", color: "text-cyber-amber border-cyber-amber/40" },
    PUBLISHING:        { label: "PUBLISHING",        color: "text-neon-blue border-neon-blue/30 animate-pulse" },
    DELIVERED:         { label: "DELIVERED",         color: "text-neon-green border-neon-green/40" },
    REVISING:          { label: "REVISING",          color: "text-alert-red border-alert-red/30 animate-pulse" },
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-white/60 uppercase tracking-widest">
                        Command Center
                    </span>
                </div>
                <span className={`font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${badge.color}`}>
                    {badge.label}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
                <AnimatePresence initial={false}>
                    {chatMessages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center h-full gap-4 text-center"
                        >
                            <div className="w-16 h-16 rounded-full border border-white/8 flex items-center justify-center text-3xl opacity-30">
                                ◈
                            </div>
                            <div>
                                <p className="font-mono text-[11px] text-white/25 tracking-wide">AI Orchestra — ready</p>
                                <p className="font-mono text-[9px] text-white/15 mt-1">Enter a mission directive below to begin</p>
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
                        className="flex justify-center mb-3"
                    >
                        <button
                            onClick={() => setActiveView("inbox")}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-amber/8 border border-cyber-amber/25
                                       text-cyber-amber font-mono text-[9px] tracking-wide hover:bg-cyber-amber/15 transition-colors"
                        >
                            <Inbox size={10} />
                            Review in Inbox →
                        </button>
                    </motion.div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5 shrink-0">
                <MissionInput />
            </div>
        </div>
    );
};
