"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, Crosshair, Radio, Zap, AlertTriangle } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

export interface Signal {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    urgency: "HIGH" | "NORMAL" | "CRITICAL";
}

interface Props {
    onOpenReview: () => void;
}

export const SignalInbox = ({ onOpenReview }: Props) => {
    const { workflowPhase, missionMessage, pendingContent } = useAgentStore();
    const isAwaiting = workflowPhase === "AWAITING_APPROVAL";
    const isDelivered = workflowPhase === "DELIVERED";

    return (
        <div className="w-full h-full flex flex-col gap-3">
            {/* ── HITL Status Panel ── */}
            <div className={`glass-panel w-full rounded-md border flex flex-col relative overflow-hidden shrink-0 transition-all duration-500
        ${isAwaiting ? "border-cyber-amber/40 shadow-[0_0_30px_rgba(255,176,0,0.15)]" : "border-white/8"}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={12} className={isAwaiting ? "text-cyber-amber animate-pulse" : "text-white/30"} />
                        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${isAwaiting ? "neon-text-amber" : "text-white/30"}`}>
                            Authorization Gate
                        </span>
                    </div>
                    {isAwaiting && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[8px] font-mono text-cyber-amber animate-pulse font-bold"
                        >
                            AWAITING
                        </motion.span>
                    )}
                </div>

                {/* Body */}
                <div className="p-4 flex-1">
                    {isAwaiting ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="text-[10px] font-mono text-cyber-amber/80 leading-relaxed">
                                {missionMessage ? `Mission: "${missionMessage.slice(0, 60)}..."` : "Task output ready for review"}
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onOpenReview}
                                className="w-full py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                  bg-cyber-amber/15 border border-cyber-amber/50 text-cyber-amber
                  hover:bg-cyber-amber/25 hover:shadow-[0_0_20px_rgba(255,176,0,0.2)]
                  transition-all flex items-center justify-center gap-2"
                                id="open-review-btn"
                                aria-label="Open review panel"
                            >
                                <ShieldAlert size={14} /> Review & Authorize
                            </motion.button>
                        </motion.div>
                    ) : isDelivered ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-4 text-center"
                        >
                            <div className="text-neon-green text-[10px] font-mono font-bold tracking-wider mb-1">
                                ✓ PAYLOAD DELIVERED
                            </div>
                            <div className="text-[8px] font-mono text-white/30">Transmission complete</div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-white/15 font-mono text-[10px] gap-2 text-center">
                            <Crosshair size={18} className="opacity-30" />
                            <span>System standby</span>
                            <span className="text-[8px]">Submit a mission to begin</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Radar Display (decorative) ── */}
            <div className="glass-panel w-full flex-1 rounded-md border border-neon-green/15 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Radio size={12} className="text-neon-green" />
                        <span className="neon-text-green font-mono text-[10px] uppercase tracking-[0.2em]">Signal Radar</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center relative">
                    <div className="absolute w-28 h-28 rounded-full border border-neon-green/10" />
                    <div className="absolute w-20 h-20 rounded-full border border-neon-green/8" />
                    <div className="absolute w-12 h-12 rounded-full border border-neon-green/6" />
                    <div className="absolute w-28 h-[1px] bg-neon-green/10" />
                    <div className="absolute h-28 w-[1px] bg-neon-green/10" />
                    <div className="absolute w-14 h-[1px] origin-left animate-radar-sweep"
                        style={{ background: "linear-gradient(to right, rgba(57,255,20,0.5), transparent)" }}
                    />
                    <div className="absolute w-2 h-2 rounded-full bg-neon-green/80 shadow-[0_0_8px_rgba(57,255,20,0.6)]" />

                    {/* Workflow status blips */}
                    {isAwaiting && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute w-2 h-2 rounded-full bg-cyber-amber animate-pulse shadow-[0_0_8px_rgba(255,176,0,0.6)]"
                            style={{ top: "30%", right: "35%" }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
