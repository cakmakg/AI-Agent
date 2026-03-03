"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldX, X, AlertTriangle, Lock, FileText, MessageSquare, Cpu, Clock } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CornerBracket = ({ position }: { position: "tl" | "tr" | "bl" | "br" }) => {
    const cls: Record<string, string> = {
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
            className={`absolute w-5 h-5 border-cyber-amber/50 ${cls[position]}`}
        />
    );
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const GlassModal = ({ isOpen, onClose }: Props) => {
    const { pendingContent, missionMessage, missionCategory, threadId, approveMission, rejectMission } = useAgentStore();
    const [judgeNote, setJudgeNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeAction, setActiveAction] = useState<"approve" | "reject" | null>(null);

    const handleApprove = async () => {
        setIsSubmitting(true);
        setActiveAction("approve");
        await approveMission(judgeNote || undefined);
        setJudgeNote("");
        setIsSubmitting(false);
        setActiveAction(null);
        onClose();
    };

    const handleReject = async () => {
        if (!judgeNote.trim()) return;
        setIsSubmitting(true);
        setActiveAction("reject");
        await rejectMission(judgeNote);
        setJudgeNote("");
        setIsSubmitting(false);
        setActiveAction(null);
        onClose();
    };

    const now = new Date();
    const timestamp = now.toLocaleString("en-GB", { hour12: false });

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 backdrop-blur-lg"
                        style={{ background: "rgba(4,8,20,0.85)" }}
                    />

                    {/* Main Panel */}
                    <motion.div
                        initial={{ scale: 0.88, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.88, opacity: 0, y: 40 }}
                        transition={{ type: "spring", damping: 24, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-lg overflow-hidden"
                        style={{
                            background: "rgba(6,10,20,0.95)",
                            border: "1px solid rgba(255,176,0,0.25)",
                            boxShadow: "0 0 80px rgba(255,176,0,0.12), 0 0 160px rgba(0,240,255,0.06), inset 0 0 60px rgba(0,0,0,0.5)",
                        }}
                    >
                        {/* Corner brackets */}
                        <CornerBracket position="tl" />
                        <CornerBracket position="tr" />
                        <CornerBracket position="bl" />
                        <CornerBracket position="br" />

                        {/* Top amber scan line */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.15, duration: 0.7 }}
                            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyber-amber to-transparent origin-center"
                        />

                        {/* ── HEADER ── */}
                        <div className="px-6 py-4 border-b shrink-0 flex justify-between items-start" style={{ borderColor: "rgba(255,176,0,0.12)" }}>
                            <div className="flex items-start gap-4">
                                {/* Lock icon */}
                                <motion.div
                                    animate={{ boxShadow: ["0 0 10px rgba(255,176,0,0.2)", "0 0 25px rgba(255,176,0,0.4)", "0 0 10px rgba(255,176,0,0.2)"] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: "rgba(255,176,0,0.1)", border: "1px solid rgba(255,176,0,0.3)" }}
                                >
                                    <Lock size={20} style={{ color: "#ffb000" }} />
                                </motion.div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="font-mono font-bold text-sm tracking-[0.2em] uppercase" style={{ color: "#ffb000", textShadow: "0 0 12px rgba(255,176,0,0.5)" }}>
                                            Authorization Gate
                                        </h2>
                                        <motion.span
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.4 }}
                                            className="font-mono text-[8px] px-1.5 py-0.5 rounded tracking-wider"
                                            style={{ background: "rgba(255,176,0,0.1)", border: "1px solid rgba(255,176,0,0.3)", color: "#ffb000" }}
                                        >
                                            AWAITING VERDICT
                                        </motion.span>
                                    </div>
                                    <p className="font-mono text-[10px] mt-1 tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
                                        HUMAN-IN-THE-LOOP · SECURITY CLEARANCE: LEVEL-4
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                                aria-label="Close authorization panel"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* ── METADATA GRID ── */}
                        <div className="px-6 py-2.5 grid grid-cols-4 gap-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
                            {[
                                { icon: <Cpu size={9} />, label: "THREAD", value: threadId ? `${threadId.slice(0, 8)}…` : "N/A" },
                                { icon: <FileText size={9} />, label: "TYPE", value: missionCategory ?? "HOT_LEAD" },
                                { icon: <Clock size={9} />, label: "TIMESTAMP", value: timestamp },
                                { icon: <AlertTriangle size={9} />, label: "PRIORITY", value: "CRITICAL" },
                            ].map(({ icon, label, value }) => (
                                <div key={label} className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                                        {icon}
                                        <span className="font-mono text-[7px] tracking-widest uppercase">{label}</span>
                                    </div>
                                    <span className="font-mono text-[9px] font-bold" style={{ color: "rgba(0,240,255,0.7)" }}>{value}</span>
                                </div>
                            ))}
                        </div>

                        {/* ── MISSION ── */}
                        {missionMessage && (
                            <div className="px-6 py-2 border-b shrink-0 flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,176,0,0.03)" }}>
                                <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "rgba(255,176,0,0.4)" }}>MISSION:</span>
                                <span className="font-mono text-[10px] truncate" style={{ color: "rgba(255,255,255,0.55)" }}>{missionMessage.slice(0, 80)}</span>
                            </div>
                        )}

                        {/* ── GENERATED OUTPUT ── */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4" style={{ scrollbarWidth: "none" }}>
                            <div className="flex items-center gap-2">
                                <FileText size={11} style={{ color: "#00f0ff" }} />
                                <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "#00f0ff" }}>Generated Output</span>
                                <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(to right, rgba(0,240,255,0.2), transparent)" }} />
                            </div>

                            <div className="rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                                <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #ffb000, #00f0ff, #ffb000)" }} />
                                <div className="p-4 max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => <h1 className="font-mono font-bold text-[14px] mb-3 mt-1 tracking-wide" style={{ color: "#00f0ff", textShadow: "0 0 10px rgba(0,240,255,0.5)" }}>{children}</h1>,
                                            h2: ({ children }) => <h2 className="font-mono font-semibold text-[12px] mb-2 mt-3 tracking-wide" style={{ color: "#39ff14", textShadow: "0 0 8px rgba(57,255,20,0.4)" }}>{children}</h2>,
                                            h3: ({ children }) => <h3 className="font-mono font-semibold text-[11px] mb-1.5 mt-2" style={{ color: "#ffb000" }}>{children}</h3>,
                                            p: ({ children }) => <p className="font-mono text-[11px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.65)" }}>{children}</p>,
                                            code: ({ className, children }) => className
                                                ? <code className="block font-mono text-[10px] leading-relaxed" style={{ color: "rgba(57,255,20,0.8)" }}>{children}</code>
                                                : <code className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ color: "#39ff14", background: "rgba(57,255,20,0.08)" }}>{children}</code>,
                                            pre: ({ children }) => <pre className="rounded p-3 mb-3 overflow-x-auto" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(57,255,20,0.12)" }}>{children}</pre>,
                                            ul: ({ children }) => <ul className="space-y-1 mb-2 pl-2 list-none">{children}</ul>,
                                            li: ({ children }) => <li className="font-mono text-[11px] flex gap-2 items-start" style={{ color: "rgba(255,255,255,0.6)" }}><span style={{ color: "rgba(0,240,255,0.5)" }} className="mt-0.5 shrink-0">▸</span><span>{children}</span></li>,
                                            strong: ({ children }) => <strong className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{children}</strong>,
                                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 font-mono text-[11px] pl-2" style={{ color: "rgba(255,255,255,0.6)" }}>{children}</ol>,
                                            table: ({ children }) => <table className="w-full font-mono text-[10px] border-collapse mb-3">{children}</table>,
                                            th: ({ children }) => <th className="text-left pb-1 pr-4 font-semibold" style={{ color: "rgba(0,240,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>{children}</th>,
                                            td: ({ children }) => <td className="py-1 pr-4" style={{ color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</td>,
                                            blockquote: ({ children }) => <blockquote className="pl-3 my-2 font-mono text-[10px]" style={{ borderLeft: "2px solid rgba(255,176,0,0.4)", color: "rgba(255,255,255,0.5)" }}>{children}</blockquote>,
                                            hr: () => <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.08)" }} />,
                                        }}
                                    >
                                        {pendingContent || "*No content available.*"}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* ── Judge Note Input ── */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={11} style={{ color: "#ffb000" }} />
                                    <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: "#ffb000" }}>
                                        Judge Note
                                        <span className="ml-1 font-normal" style={{ color: "rgba(255,255,255,0.25)" }}>(required for rejection)</span>
                                    </span>
                                </div>
                                <textarea
                                    value={judgeNote}
                                    onChange={(e) => setJudgeNote(e.target.value)}
                                    placeholder='e.g. "PostgreSQL entegrasyonu eklensin, API dokümantasyonu genişletilsin..."'
                                    rows={3}
                                    className="w-full rounded p-3 font-mono text-[11px] outline-none resize-none transition-all"
                                    style={{
                                        background: "rgba(255,255,255,0.025)",
                                        border: judgeNote.trim()
                                            ? "1px solid rgba(255,176,0,0.4)"
                                            : "1px solid rgba(255,255,255,0.08)",
                                        color: "rgba(255,255,255,0.8)",
                                    }}
                                    id="judge-note-input"
                                    aria-label="Judge feedback note"
                                />
                            </div>

                            {/* ── Warning ── */}
                            <div className="flex items-start gap-2.5 p-3 rounded" style={{ background: "rgba(255,176,0,0.04)", border: "1px solid rgba(255,176,0,0.12)" }}>
                                <AlertTriangle size={13} style={{ color: "#ffb000" }} className="shrink-0 mt-0.5" />
                                <p className="font-mono text-[10px] leading-relaxed" style={{ color: "rgba(255,176,0,0.65)" }}>
                                    <strong style={{ color: "#ffb000" }}>AUTHORIZE</strong> will publish to Discord/Slack webhooks immediately.
                                    <strong style={{ color: "#ff2d55" }}> OVERRIDE</strong> sends your feedback back to the AI Orchestra for revision.
                                </p>
                            </div>
                        </div>

                        {/* ── ACTION FOOTER (The Judge Panel) ── */}
                        <div className="shrink-0 border-t" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)" }}>
                            <div className="grid grid-cols-2 gap-0">
                                {/* OVERRIDE button */}
                                <motion.button
                                    whileHover={!isSubmitting && judgeNote.trim() ? { scale: 1.01 } : {}}
                                    whileTap={!isSubmitting && judgeNote.trim() ? { scale: 0.99 } : {}}
                                    onClick={handleReject}
                                    disabled={isSubmitting || !judgeNote.trim()}
                                    className="relative py-5 flex flex-col items-center justify-center gap-1.5 font-mono transition-all duration-200"
                                    style={{
                                        borderRight: "1px solid rgba(255,255,255,0.06)",
                                        background: activeAction === "reject"
                                            ? "rgba(255,45,85,0.15)"
                                            : judgeNote.trim() ? "rgba(255,45,85,0.05)" : "transparent",
                                        opacity: judgeNote.trim() ? 1 : 0.35,
                                        cursor: judgeNote.trim() ? "pointer" : "not-allowed",
                                    }}
                                    id="override-btn"
                                    aria-label="Override and reject — send back for revision"
                                >
                                    {activeAction === "reject" ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                            <ShieldX size={22} style={{ color: "#ff2d55" }} />
                                        </motion.div>
                                    ) : (
                                        <ShieldX size={22} style={{ color: "#ff2d55" }} />
                                    )}
                                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "#ff2d55", textShadow: judgeNote.trim() ? "0 0 10px rgba(255,45,85,0.5)" : "none" }}>
                                        OVERRIDE
                                    </span>
                                    <span className="text-[8px] tracking-wider" style={{ color: "rgba(255,45,85,0.5)" }}>
                                        Send back for revision
                                    </span>
                                </motion.button>

                                {/* AUTHORIZE button */}
                                <motion.button
                                    whileHover={!isSubmitting ? { scale: 1.01 } : {}}
                                    whileTap={!isSubmitting ? { scale: 0.99 } : {}}
                                    onClick={handleApprove}
                                    disabled={isSubmitting}
                                    className="relative py-5 flex flex-col items-center justify-center gap-1.5 font-mono transition-all duration-200"
                                    style={{
                                        background: activeAction === "approve"
                                            ? "rgba(57,255,20,0.12)"
                                            : "rgba(57,255,20,0.05)",
                                    }}
                                    id="authorize-btn"
                                    aria-label="Authorize and publish"
                                >
                                    {/* Pulsing glow bg */}
                                    <motion.div
                                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: "radial-gradient(ellipse at center, rgba(57,255,20,0.06) 0%, transparent 70%)" }}
                                    />
                                    {activeAction === "approve" ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                            <ShieldCheck size={22} style={{ color: "#39ff14" }} />
                                        </motion.div>
                                    ) : (
                                        <ShieldCheck size={22} style={{ color: "#39ff14" }} />
                                    )}
                                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "#39ff14", textShadow: "0 0 12px rgba(57,255,20,0.6)" }}>
                                        AUTHORIZE
                                    </span>
                                    <span className="text-[8px] tracking-wider" style={{ color: "rgba(57,255,20,0.5)" }}>
                                        Publish to Discord/Slack
                                    </span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
