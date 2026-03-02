"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, X, AlertTriangle, Lock, FileText, MessageSquare } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

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

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const GlassModal = ({ isOpen, onClose }: Props) => {
    const { pendingContent, missionMessage, approveMission, rejectMission, workflowPhase } = useAgentStore();
    const [judgeNote, setJudgeNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = async () => {
        setIsSubmitting(true);
        await approveMission(judgeNote || undefined);
        setJudgeNote("");
        setIsSubmitting(false);
        onClose();
    };

    const handleReject = async () => {
        if (!judgeNote.trim()) {
            // Note is required for rejection
            return;
        }
        setIsSubmitting(true);
        await rejectMission(judgeNote);
        setJudgeNote("");
        setIsSubmitting(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-8"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 22, stiffness: 280 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-lg overflow-hidden
              bg-[#060a0f]/90 backdrop-blur-xl border border-cyber-amber/20
              shadow-[0_0_60px_rgba(255,176,0,0.1),0_0_120px_rgba(0,240,255,0.05)]"
                    >
                        <CornerBracket position="tl" />
                        <CornerBracket position="tr" />
                        <CornerBracket position="bl" />
                        <CornerBracket position="br" />

                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-amber to-transparent origin-center"
                        />

                        {/* Header */}
                        <div className="p-5 border-b border-white/8 flex justify-between items-start shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyber-amber/10 border border-cyber-amber/25 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,176,0,0.15)]">
                                    <Lock size={18} className="text-cyber-amber" />
                                </div>
                                <div>
                                    <h2 className="text-base font-mono font-semibold text-white tracking-wide">
                                        HUMAN-IN-THE-LOOP AUTHORIZATION
                                    </h2>
                                    <p className="font-mono text-[9px] text-white/30 mt-1 tracking-widest uppercase">
                                        MISSION: {missionMessage?.slice(0, 60) || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content Review Area */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-4 min-h-0">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText size={12} className="text-neon-blue" />
                                <span className="text-[10px] font-mono text-neon-blue uppercase tracking-wider">Generated Output</span>
                            </div>

                            <div className="relative rounded border border-white/8 bg-white/[0.02] overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-amber via-neon-blue to-cyber-amber" />
                                <div className="p-4 pl-5 font-mono text-[11px] text-white/70 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-hide">
                                    {pendingContent || "No content available."}
                                </div>
                            </div>

                            {/* Judge Note Input */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={12} className="text-cyber-amber" />
                                    <span className="text-[10px] font-mono text-cyber-amber uppercase tracking-wider">
                                        Judge Note <span className="text-white/20">(required for rejection)</span>
                                    </span>
                                </div>
                                <textarea
                                    value={judgeNote}
                                    onChange={(e) => setJudgeNote(e.target.value)}
                                    placeholder='e.g. "Mimari harika ama Next.js 14 eklensin"'
                                    rows={3}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded p-3 font-mono text-[11px] text-white/80 placeholder:text-white/20 outline-none focus:border-cyber-amber/40 transition-colors resize-none"
                                    id="judge-note-input"
                                    aria-label="Judge feedback note"
                                />
                            </div>

                            {/* Warning */}
                            <div className="flex items-start gap-2 p-3 bg-cyber-amber/5 border border-cyber-amber/15 rounded">
                                <AlertTriangle size={14} className="text-cyber-amber shrink-0 mt-0.5" />
                                <p className="text-[10px] font-mono text-cyber-amber/70 leading-relaxed">
                                    AUTHORIZE will publish the output to external channels (Discord/Slack). OVERRIDE will send your
                                    feedback back to the AI Orchestra for revision.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-white/8 flex justify-between items-center bg-white/[0.01] shrink-0">
                            <span className="text-[8px] font-mono text-white/20 tracking-wider">
                                SECURITY CLEARANCE: LEVEL-4
                            </span>
                            <div className="flex gap-2.5">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleReject}
                                    disabled={isSubmitting || !judgeNote.trim()}
                                    className="px-5 py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                    border border-alert-red/40 text-alert-red
                    hover:bg-alert-red/10 hover:border-alert-red/60 hover:shadow-[0_0_20px_rgba(255,45,85,0.15)]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center gap-2"
                                    id="override-btn"
                                    aria-label="Override and reject"
                                >
                                    <ShieldX size={14} /> Override
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                    bg-cyber-amber/15 border border-cyber-amber/50 text-cyber-amber
                    hover:bg-cyber-amber/25 hover:border-cyber-amber/70 hover:shadow-[0_0_25px_rgba(255,176,0,0.2)]
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center gap-2"
                                    id="authorize-btn"
                                    aria-label="Authorize and publish"
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
