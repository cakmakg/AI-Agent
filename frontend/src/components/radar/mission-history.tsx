"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Archive, X, Clock, CheckCircle,
    XCircle, AlertTriangle, Loader2, FileText, ChevronRight,
} from "lucide-react";
import { useAgentStore, type MissionSummary } from "@/store/agent-store";

// ── Status badge config ──
const STATUS_CFG = {
    PUBLISHED:        { label: "PUBLISHED",  cls: "text-neon-green  border-neon-green/40  bg-neon-green/8",  Icon: CheckCircle  },
    APPROVED:         { label: "APPROVED",   cls: "text-neon-green  border-neon-green/40  bg-neon-green/8",  Icon: CheckCircle  },
    AWAITING_APPROVAL:{ label: "PENDING",    cls: "text-cyber-amber border-cyber-amber/40 bg-cyber-amber/8", Icon: AlertTriangle },
    REJECTED:         { label: "REJECTED",   cls: "text-alert-red   border-alert-red/40   bg-alert-red/8",   Icon: XCircle      },
} as const;

// ── Mission card (list item) ──
function MissionCard({ mission, isSelected, onClick }: {
    mission: MissionSummary;
    isSelected: boolean;
    onClick: () => void;
}) {
    const cfg = STATUS_CFG[mission.status as keyof typeof STATUS_CFG] ?? STATUS_CFG["AWAITING_APPROVAL"];
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
            className={`cursor-pointer rounded border p-3 flex flex-col gap-2 transition-all ${
                isSelected
                    ? "border-neon-blue/40 bg-neon-blue/8"
                    : "border-white/8 bg-white/3 hover:border-white/15"
            }`}
            aria-label={`Mission: ${mission.task}`}
        >
            <div className="flex items-center justify-between gap-2">
                <span className={`font-mono text-[9px] px-2 py-[2px] rounded border flex items-center gap-1.5 shrink-0 ${cfg.cls}`}>
                    <cfg.Icon size={9} />
                    {cfg.label}
                </span>
                <span className="font-mono text-[8px] text-white/25 flex items-center gap-1">
                    <Clock size={8} /> {date}
                </span>
            </div>

            <p className="font-mono text-[10px] text-white/70 leading-[1.5] line-clamp-2">
                {mission.task}
            </p>

            {mission.contentPreview && (
                <p className="font-mono text-[9px] text-white/30 leading-[1.4] line-clamp-2">
                    {mission.contentPreview}
                </p>
            )}

            {isSelected && (
                <div className="flex items-center gap-1 text-neon-blue/70 font-mono text-[9px]">
                    <ChevronRight size={10} /> Viewing report →
                </div>
            )}
        </motion.div>
    );
}

// ── Markdown overrides ──
const MD = {
    h1: ({ children }: { children?: React.ReactNode }) =>
        <h1 className="font-mono font-bold text-[18px] text-neon-blue mb-4 mt-2 tracking-wide">{children}</h1>,
    h2: ({ children }: { children?: React.ReactNode }) =>
        <h2 className="font-mono font-bold text-[14px] text-neon-green mb-3 mt-6">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) =>
        <h3 className="font-mono font-semibold text-[12px] text-cyber-amber mb-2 mt-4">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) =>
        <p className="font-mono text-[11px] text-white/65 mb-3 leading-[1.9]">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) =>
        <ul className="mb-3 space-y-1.5 pl-3">{children}</ul>,
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="font-mono text-[10px] text-white/60 flex gap-2">
            <span className="text-neon-blue/40 shrink-0 mt-0.5">▸</span><span>{children}</span>
        </li>
    ),
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
        const isBlock = className?.includes("language-");
        return isBlock
            ? <pre className="bg-black/50 border border-neon-green/15 rounded p-4 overflow-x-auto my-3 font-mono text-[10px] text-neon-green/80">{children}</pre>
            : <code className="font-mono text-[10px] text-neon-green bg-neon-green/8 px-1.5 py-0.5 rounded">{children}</code>;
    },
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    hr: () => <hr className="border-none h-[1px] my-5" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />,
    strong: ({ children }: { children?: React.ReactNode }) =>
        <strong className="text-white font-bold">{children}</strong>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-neon-blue/30 pl-4 my-3 text-white/40 italic">{children}</blockquote>
    ),
};

// ── Main component ──
export function MissionHistory() {
    const { missions, selectedMission, archiveOpen, toggleArchive, selectMission, fetchMissions } = useAgentStore();

    useEffect(() => {
        if (archiveOpen) fetchMissions();
    }, [archiveOpen, fetchMissions]);

    // ESC to close
    useEffect(() => {
        if (!archiveOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") toggleArchive(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [archiveOpen, toggleArchive]);

    return (
        <>
            {/* ── Trigger button (always in right panel) ── */}
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleArchive}
                className={`w-full py-2 rounded border font-mono text-[9px] uppercase tracking-[0.15em]
                    flex items-center justify-center gap-2 transition-all
                    ${archiveOpen
                        ? "border-neon-blue/40 bg-neon-blue/8 text-neon-blue/80"
                        : "border-white/10 bg-white/3 hover:border-neon-blue/30 hover:bg-neon-blue/5 text-white/35 hover:text-neon-blue/70"
                    }`}
                aria-label="Toggle mission archive"
                id="archive-toggle-btn"
            >
                <Archive size={11} />
                Mission Archive
                {missions.length > 0 && (
                    <span className="font-mono text-[7px] bg-white/8 px-1 rounded">{missions.length}</span>
                )}
            </motion.button>

            {/* ── Full-screen modal overlay ── */}
            <AnimatePresence>
                {archiveOpen && (
                    <motion.div
                        key="archive-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-6"
                        style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)" }}
                        onClick={(e) => { if (e.target === e.currentTarget) toggleArchive(); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 24 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            className="relative w-full max-w-[1200px] h-[82vh] flex flex-col rounded-lg border border-neon-blue/25 overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, rgba(6,10,15,0.98) 0%, rgba(0,12,28,0.96) 100%)",
                                boxShadow: "0 0 80px rgba(0,240,255,0.07), 0 0 200px rgba(0,240,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)",
                            }}
                        >
                            {/* Corner brackets */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-blue/60 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-blue/60 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-blue/20 pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-blue/20 pointer-events-none" />

                            {/* ── Header ── */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Archive size={16} className="text-neon-blue" />
                                    <span
                                        className="font-mono text-[13px] uppercase tracking-[0.25em] text-neon-blue/90"
                                        style={{ textShadow: "0 0 14px rgba(0,240,255,0.5)" }}
                                    >
                                        Mission Archive
                                    </span>
                                    <span className="font-mono text-[9px] text-white/30 bg-white/5 px-2.5 py-[2px] rounded border border-white/8">
                                        {missions.length} records
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-[8px] text-white/20 hidden sm:block">
                                        ESC or click outside to close
                                    </span>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={toggleArchive}
                                        className="text-white/30 hover:text-white/70 transition-colors p-1"
                                        aria-label="Close archive"
                                    >
                                        <X size={18} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* ── Body: list + viewer ── */}
                            <div className="flex flex-1 min-h-0 overflow-hidden">

                                {/* Left column — mission list */}
                                <div
                                    className="w-[340px] shrink-0 flex flex-col p-4 overflow-y-auto border-r border-white/5"
                                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,240,255,0.15) transparent" }}
                                >
                                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/20 mb-3 px-1">
                                        Completed Missions
                                    </div>

                                    {missions.length === 0 ? (
                                        <div className="flex flex-col items-center py-16 gap-3 text-white/15">
                                            <FileText size={28} className="opacity-20" />
                                            <span className="font-mono text-[10px]">No missions recorded yet</span>
                                            <span className="font-mono text-[8px] text-white/10 text-center">
                                                Missions appear here after<br />workflow completion
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
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
                                        </div>
                                    )}
                                </div>

                                {/* Right column — full report viewer */}
                                <div
                                    className="flex-1 overflow-y-auto p-8 min-w-0"
                                    style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(57,255,20,0.12) transparent" }}
                                >
                                    {!selectedMission ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-white/15">
                                            <FileText size={48} className="opacity-10" />
                                            <p className="font-mono text-[11px] text-center leading-loose">
                                                Select a mission from the left panel<br />
                                                <span className="text-white/10 text-[9px]">Full report will appear here</span>
                                            </p>
                                        </div>
                                    ) : !selectedMission.content ? (
                                        <div className="flex items-center justify-center h-full gap-3 text-white/25">
                                            <Loader2 size={20} className="animate-spin" />
                                            <span className="font-mono text-[11px]">Loading report...</span>
                                        </div>
                                    ) : (
                                        <motion.div
                                            key={selectedMission.threadId}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="max-w-[860px]"
                                        >
                                            {/* Report meta */}
                                            <div className="mb-6 pb-5 border-b border-white/6 flex flex-wrap items-center gap-3">
                                                {(() => {
                                                    const cfg = STATUS_CFG[selectedMission.status as keyof typeof STATUS_CFG] ?? STATUS_CFG["AWAITING_APPROVAL"];
                                                    return (
                                                        <span className={`font-mono text-[10px] px-3 py-1 rounded border flex items-center gap-1.5 ${cfg.cls}`}>
                                                            <cfg.Icon size={10} /> {cfg.label}
                                                        </span>
                                                    );
                                                })()}
                                                <span className="font-mono text-[9px] text-white/25">
                                                    {new Date(selectedMission.createdAt).toLocaleString("de-DE")}
                                                </span>
                                                {selectedMission.humanFeedback && (
                                                    <span className="font-mono text-[9px] text-cyber-amber/60 italic">
                                                        ↳ {selectedMission.humanFeedback}
                                                    </span>
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
