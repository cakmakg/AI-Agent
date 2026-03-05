"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Archive, X, ChevronRight, Clock, CheckCircle,
    XCircle, AlertTriangle, Loader2, FileText,
} from "lucide-react";
import { useAgentStore, type MissionSummary } from "@/store/agent-store";

// ── Status badge config ──
const STATUS_CFG = {
    PUBLISHED: { label: "PUBLISHED", cls: "text-neon-green border-neon-green/40 bg-neon-green/8", Icon: CheckCircle },
    APPROVED: { label: "APPROVED", cls: "text-neon-green border-neon-green/40 bg-neon-green/8", Icon: CheckCircle },
    AWAITING_APPROVAL: { label: "PENDING", cls: "text-cyber-amber border-cyber-amber/40 bg-cyber-amber/8", Icon: AlertTriangle },
    REJECTED: { label: "REJECTED", cls: "text-alert-red border-alert-red/40 bg-alert-red/8", Icon: XCircle },
} as const;

// ── Mission card (list item) ──
function MissionCard({ mission, isSelected, onClick }: {
    mission: MissionSummary;
    isSelected: boolean;
    onClick: () => void;
}) {
    const cfg = STATUS_CFG[mission.status] ?? STATUS_CFG["AWAITING_APPROVAL"];
    const date = new Date(mission.createdAt).toLocaleDateString("de-DE", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            whileHover={{ scale: 1.01 }}
            onClick={onClick}
            className={`cursor-pointer rounded border p-2.5 flex flex-col gap-1.5 transition-all ${isSelected
                    ? "border-neon-blue/40 bg-neon-blue/8"
                    : "border-white/8 bg-white/3 hover:border-white/15"
                }`}
            aria-label={`Mission: ${mission.task}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[7.5px] px-1.5 py-[1px] rounded border flex items-center gap-1 shrink-0 ${cfg.cls}`}>
                    <cfg.Icon size={7} />
                    {cfg.label}
                </span>
                <span className="font-mono text-[7px] text-white/25 flex items-center gap-1">
                    <Clock size={7} /> {date}
                </span>
            </div>

            <p className="font-mono text-[9px] text-white/70 leading-[1.5] line-clamp-2">
                {mission.task}
            </p>

            {mission.contentPreview && (
                <p className="font-mono text-[8px] text-white/30 leading-[1.4] line-clamp-1">
                    {mission.contentPreview}
                </p>
            )}

            {isSelected && (
                <div className="flex items-center gap-1 text-neon-blue/70 font-mono text-[7.5px]">
                    <ChevronRight size={8} /> Reading full report...
                </div>
            )}
        </motion.div>
    );
}

// ── Markdown mini-overrides (same palette, smaller sizes) ──
const MD = {
    h1: ({ children }: { children?: React.ReactNode }) => <h1 className="font-mono font-bold text-[14px] text-neon-blue mb-4 mt-2 tracking-wide">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="font-mono font-bold text-[12px] text-neon-green mb-2 mt-5">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="font-mono font-semibold text-[10px] text-cyber-amber mb-1 mt-3">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="font-mono text-[10px] text-white/65 mb-2 leading-[1.8]">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-2 space-y-1 pl-2">{children}</ul>,
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="font-mono text-[9px] text-white/60 flex gap-1.5">
            <span className="text-neon-blue/40 shrink-0">▸</span><span>{children}</span>
        </li>
    ),
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes("language-");
        return isBlock
            ? <pre className="bg-black/50 border border-neon-green/12 rounded p-3 overflow-x-auto my-2 font-mono text-[9px] text-neon-green/80">{children}</pre>
            : <code className="font-mono text-[9px] text-neon-green bg-neon-green/8 px-1 rounded">{children}</code>;
    },
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    hr: () => <hr className="border-none h-[1px] my-4" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-white font-bold">{children}</strong>,
};

// ── Main component ──
export function MissionHistory() {
    const { missions, selectedMission, archiveOpen, toggleArchive, selectMission, fetchMissions } = useAgentStore();
    const listRef = useRef<HTMLDivElement>(null);

    // Refresh list on open
    useEffect(() => {
        if (archiveOpen) fetchMissions();
    }, [archiveOpen, fetchMissions]);

    if (!archiveOpen) {
        return (
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleArchive}
                className="w-full py-2 rounded border border-white/10 bg-white/3 hover:border-neon-blue/30 hover:bg-neon-blue/5
                           font-mono text-[9px] uppercase tracking-[0.15em] text-white/35 hover:text-neon-blue/70
                           flex items-center justify-center gap-2 transition-all"
                aria-label="Open mission archive"
                id="archive-toggle-btn"
            >
                <Archive size={11} />
                Mission Archive
                {missions.length > 0 && (
                    <span className="font-mono text-[7px] bg-white/8 px-1 rounded">{missions.length}</span>
                )}
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass-panel w-full rounded-md border border-neon-blue/20 flex flex-col overflow-hidden"
            style={{ maxHeight: "calc(100vh - 200px)", boxShadow: "0 0 30px rgba(0,240,255,0.06)" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/6 shrink-0">
                <div className="flex items-center gap-2">
                    <Archive size={11} className="text-neon-blue" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neon-blue/80">
                        Mission Archive
                    </span>
                    <span className="font-mono text-[8px] text-white/25 bg-white/5 px-1.5 py-[1px] rounded">
                        {missions.length}
                    </span>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleArchive}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Close archive"
                >
                    <X size={12} />
                </motion.button>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Mission list */}
                <div
                    ref={listRef}
                    className="w-[180px] shrink-0 flex flex-col gap-1.5 p-2 overflow-y-auto border-r border-white/5"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,240,255,0.15) transparent" }}
                >
                    {missions.length === 0 ? (
                        <div className="flex flex-col items-center py-8 gap-2 text-white/15">
                            <FileText size={18} className="opacity-20" />
                            <span className="font-mono text-[8px]">No missions yet</span>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {missions.map(m => (
                                <MissionCard
                                    key={m.threadId}
                                    mission={m}
                                    isSelected={selectedMission?.threadId === m.threadId}
                                    onClick={() => selectMission(m.threadId)}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Report viewer */}
                <div
                    className="flex-1 overflow-y-auto p-3 min-w-0"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(57,255,20,0.12) transparent" }}
                >
                    {!selectedMission ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                            <FileText size={28} className="opacity-20" />
                            <span className="font-mono text-[9px] text-center">
                                Select a mission<br />to read the report
                            </span>
                        </div>
                    ) : !selectedMission.content ? (
                        <div className="flex items-center justify-center h-full gap-2 text-white/25">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="font-mono text-[9px]">Loading report...</span>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="prose-sm max-w-none"
                        >
                            {/* Meta */}
                            <div className="mb-4 pb-3 border-b border-white/6 flex flex-col gap-1">
                                <div className={`font-mono text-[8px] px-2 py-[2px] rounded border self-start flex items-center gap-1.5 ${STATUS_CFG[selectedMission.status]?.cls}`}>
                                    {selectedMission.status}
                                </div>
                                <p className="font-mono text-[8px] text-white/25">
                                    {new Date(selectedMission.createdAt).toLocaleString("de-DE")}
                                </p>
                                {selectedMission.humanFeedback && (
                                    <p className="font-mono text-[8px] text-cyber-amber/60 italic">
                                        ↳ {selectedMission.humanFeedback}
                                    </p>
                                )}
                            </div>

                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>
                                {selectedMission.content}
                            </ReactMarkdown>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
