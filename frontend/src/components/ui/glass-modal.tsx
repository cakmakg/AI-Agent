"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, X, AlertTriangle, Lock, Terminal } from "lucide-react";
import type { Signal } from "../radar/signal-inbox";

interface Props {
    isOpen: boolean;
    signal: Signal | null;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

const CornerBracket = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const positionClasses: Record<string, string> = {
        tl: "top-0 left-0 border-t border-l",
        tr: "top-0 right-0 border-t border-r",
        bl: "bottom-0 left-0 border-b border-l",
        br: "bottom-0 right-0 border-b border-r",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`absolute w-4 h-4 border-cyber-amber/40 ${positionClasses[position]}`}
        />
    );
};

export const GlassModal = ({ isOpen, signal, onClose, onApprove, onReject }: Props) => {
    return (
        <AnimatePresence>
            {isOpen && signal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-8"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 5 }}
                        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl rounded-lg overflow-hidden
              bg-[#060a0f]/90 backdrop-blur-xl
              border border-cyber-amber/20
              shadow-[0_0_60px_rgba(255,176,0,0.1),0_0_120px_rgba(0,240,255,0.05)]"
                    >
                        {/* Corner brackets */}
                        <CornerBracket position="tl" />
                        <CornerBracket position="tr" />
                        <CornerBracket position="bl" />
                        <CornerBracket position="br" />

                        {/* Top accent line */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-amber to-transparent origin-center"
                        />

                        {/* Header */}
                        <div className="p-5 border-b border-white/8 flex justify-between items-start">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyber-amber/10 border border-cyber-amber/25 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,176,0,0.15)]">
                                    <Lock size={18} className="text-cyber-amber" />
                                </div>
                                <div>
                                    <h2 className="text-base font-mono font-semibold text-white tracking-wide flex items-center gap-2">
                                        HUMAN-IN-THE-LOOP AUTHORIZATION
                                    </h2>
                                    <p className="font-mono text-[9px] text-white/30 mt-1 tracking-widest uppercase">
                                        SIGNAL_ID: {signal.id} • ORIGIN: {signal.source}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Task Info Card */}
                            <div className="relative rounded border border-white/8 bg-white/[0.02] overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-amber via-neon-blue to-cyber-amber" />
                                <div className="p-4 pl-5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal size={12} className="text-neon-blue" />
                                        <span className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">Task Output</span>
                                    </div>
                                    <h3 className="text-sm font-mono font-bold text-white mb-2">{signal.title}</h3>
                                    <p className="text-[11px] font-mono text-white/50 leading-relaxed">
                                        The Agent Swarm has completed its assigned workflow and generated the output artifact.
                                        As the final security firewall, your explicit authorization is required before the system
                                        can proceed with external distribution or production deployment.
                                    </p>
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: "STATUS", value: signal.status, color: "text-cyber-amber" },
                                    { label: "URGENCY", value: signal.urgency, color: signal.urgency === "CRITICAL" ? "text-alert-red" : signal.urgency === "HIGH" ? "text-cyber-amber" : "text-white/70" },
                                    { label: "TIMESTAMP", value: signal.timestamp, color: "text-white/70" },
                                    { label: "PROTOCOL", value: "HITL-v2", color: "text-neon-green" },
                                ].map((item) => (
                                    <div key={item.label} className="bg-white/[0.02] border border-white/5 rounded p-2.5">
                                        <span className="block text-[8px] font-mono text-white/25 mb-1 tracking-wider">{item.label}</span>
                                        <span className={`block text-[10px] font-mono font-bold ${item.color}`}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 bg-cyber-amber/5 border border-cyber-amber/15 rounded">
                                <AlertTriangle size={14} className="text-cyber-amber shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-cyber-amber/70 leading-relaxed">
                                    This action is irreversible. Approving will authorize the Publisher agent to distribute
                                    the output to configured external channels (Discord, Slack, Webhooks).
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-white/8 flex justify-between items-center bg-white/[0.01]">
                            <span className="text-[8px] font-mono text-white/20 tracking-wider">
                                SECURITY CLEARANCE: LEVEL-4 REQUIRED
                            </span>
                            <div className="flex gap-2.5">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onReject(signal.id)}
                                    className="px-5 py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                    border border-alert-red/40 text-alert-red
                    hover:bg-alert-red/10 hover:border-alert-red/60 hover:shadow-[0_0_20px_rgba(255,45,85,0.15)]
                    transition-all duration-200 flex items-center gap-2"
                                >
                                    <ShieldX size={14} /> Override
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onApprove(signal.id)}
                                    className="px-5 py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                    bg-cyber-amber/15 border border-cyber-amber/50 text-cyber-amber
                    hover:bg-cyber-amber/25 hover:border-cyber-amber/70 hover:shadow-[0_0_25px_rgba(255,176,0,0.2)]
                    transition-all duration-200 flex items-center gap-2"
                                >
                                    <ShieldCheck size={14} /> Authorize
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
