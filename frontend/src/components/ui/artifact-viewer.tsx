"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
    FileText, CheckCircle, XCircle, Loader2, AlertTriangle,
    RefreshCw, Database, Copy, Check,
} from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

// ─────────────────────────────────────────────
// Markdown bileşen overrides — Cyber-Nexus teması
// ─────────────────────────────────────────────
const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => (
        <h1 className="font-mono font-bold text-[18px] mb-5 mt-2 tracking-wide text-neon-blue"
            style={{ textShadow: "0 0 20px rgba(0,240,255,0.5)" }}>
            {children}
        </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
        <h2 className="font-mono font-bold text-[14px] mb-3 mt-6 tracking-wide text-neon-green"
            style={{ textShadow: "0 0 10px rgba(57,255,20,0.3)" }}>
            {children}
        </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="font-mono font-semibold text-[12px] mb-2 mt-4 text-cyber-amber">
            {children}
        </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="font-mono text-[11px] text-white/70 mb-3 leading-[1.9]">{children}</p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="mb-3 space-y-1.5 pl-2">{children}</ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="mb-3 space-y-1.5 pl-4 list-decimal text-white/60 font-mono text-[11px]">{children}</ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="font-mono text-[11px] text-white/65 flex gap-2">
            <span className="text-neon-blue/50 shrink-0 mt-0.5">▸</span>
            <span>{children}</span>
        </li>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="text-white font-bold">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
        <em className="text-neon-blue/80 not-italic">{children}</em>
    ),
    hr: () => (
        <hr className="border-none h-[1px] my-6"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-2 border-neon-blue/40 pl-4 my-3 italic font-mono text-[10px] text-white/45">
            {children}
        </blockquote>
    ),
    // ── Kod blokları: SyntaxHighlighter (dil tanımlıysa) / inline code ──
    code: ({ className, children, ...rest }: { className?: string; children?: React.ReactNode;[key: string]: unknown }) => {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children ?? "").replace(/\n$/, "");

        if (match) {
            return (
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                        background: "rgba(0,0,0,0.55)",
                        border: "1px solid rgba(57,255,20,0.15)",
                        borderRadius: "6px",
                        fontSize: "11px",
                        padding: "12px 16px",
                        margin: "8px 0",
                        fontFamily: "var(--font-geist-mono), monospace",
                    }}
                    codeTagProps={{ style: { fontFamily: "inherit" } }}
                    {...(rest as object)}
                >
                    {codeString}
                </SyntaxHighlighter>
            );
        }
        return (
            <code className="font-mono text-[10px] text-neon-green bg-neon-green/8 border border-neon-green/15 px-1.5 py-0.5 rounded">
                {children}
            </code>
        );
    },
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    table: ({ children }: { children?: React.ReactNode }) => (
        <table className="w-full border-collapse my-4 font-mono text-[10px]">{children}</table>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
        <th className="border border-white/10 px-3 py-2 text-neon-blue/80 text-left font-bold bg-neon-blue/5">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
        <td className="border border-white/8 px-3 py-2 text-white/55">{children}</td>
    ),
};

// ─────────────────────────────────────────────
// Ana bileşen
// ─────────────────────────────────────────────
export const ArtifactViewer = () => {
    const {
        pendingContent,
        workflowPhase,
        approveMission,
        rejectMission,
        pullLatestArtifact,
    } = useAgentStore();

    const [feedback, setFeedback] = useState("");
    const [isActing, setIsActing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!pendingContent) return;
        try {
            await navigator.clipboard.writeText(pendingContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = pendingContent;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isVisible = workflowPhase === "AWAITING_APPROVAL" && !!pendingContent;

    const handlePull = async () => {
        setIsPulling(true);
        await pullLatestArtifact();
        setIsPulling(false);
    };

    const handleApprove = async () => {
        setIsActing(true);
        await approveMission(feedback || undefined);
        setFeedback("");
        setIsActing(false);
    };

    const handleReject = async () => {
        if (!feedback.trim()) return;
        setIsActing(true);
        await rejectMission(feedback);
        setFeedback("");
        setIsActing(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="artifact-viewer"
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.97 }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                    className="absolute inset-0 z-20 flex flex-col rounded-md overflow-hidden"
                    style={{
                        background: "linear-gradient(160deg, rgba(4,8,12,0.98) 0%, rgba(8,5,18,0.98) 100%)",
                        border: "1px solid rgba(255,176,0,0.28)",
                        boxShadow: "0 0 70px rgba(255,176,0,0.08), inset 0 0 100px rgba(0,0,0,0.5)",
                    }}
                >
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyber-amber/60 rounded-tl-md pointer-events-none" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyber-amber/60 rounded-tr-md pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyber-amber/25 rounded-bl-md pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyber-amber/25 rounded-br-md pointer-events-none" />

                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-5 py-3 border-b border-cyber-amber/18 shrink-0"
                        style={{ background: "rgba(255,176,0,0.035)" }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded border border-cyber-amber/40 bg-cyber-amber/10 flex items-center justify-center shrink-0">
                                <FileText size={14} className="text-cyber-amber" />
                            </div>
                            <div>
                                <div
                                    className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyber-amber"
                                    style={{ textShadow: "0 0 10px rgba(255,176,0,0.5)" }}
                                >
                                    AI Generated Artifact
                                </div>
                                <div className="text-[8px] font-mono text-white/22 tracking-wider mt-0.5">
                                    HUMAN-IN-THE-LOOP — REVIEW REQUIRED BEFORE DISPATCH
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* COPY */}
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handleCopy}
                                disabled={!pendingContent}
                                title="Copy to clipboard"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40"
                                style={{
                                    border: copied ? "1px solid rgba(57,255,20,0.5)" : "1px solid rgba(255,255,255,0.15)",
                                    background: copied ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
                                    color: copied ? "#39ff14" : "rgba(255,255,255,0.45)",
                                }}
                                aria-label="Copy artifact content"
                            >
                                {copied ? <Check size={9} /> : <Copy size={9} />}
                                {copied ? "COPIED" : "COPY"}
                            </motion.button>

                            {/* PULL LATEST INTEL */}
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={handlePull}
                                disabled={isPulling || isActing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    border: "1px solid rgba(0,240,255,0.35)",
                                    background: "rgba(0,240,255,0.06)",
                                    color: "#00f0ff",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,240,255,0.14)";
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(0,240,255,0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,240,255,0.06)";
                                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                                }}
                            >
                                {isPulling
                                    ? <Loader2 size={9} className="animate-spin" />
                                    : <RefreshCw size={9} />}
                                {isPulling ? "PULLING..." : "PULL LATEST INTEL"}
                            </motion.button>

                            {/* AWAITING badge */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.6 }}
                                className="flex items-center gap-1.5 text-[8px] font-mono text-cyber-amber tracking-[0.12em]"
                            >
                                <AlertTriangle size={9} />
                                AWAITING AUTH
                            </motion.div>
                        </div>
                    </div>

                    {/* ── Markdown Content ── */}
                    <div
                        className="flex-1 overflow-y-auto px-8 py-6"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,176,0,0.18) transparent" }}
                    >
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {pendingContent!}
                        </ReactMarkdown>
                    </div>

                    {/* ── Bottom: Info + Actions ── */}
                    <div
                        className="shrink-0 border-t border-white/8 px-5 py-3 flex items-center gap-3"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                    >
                        {/* Database origin indicator */}
                        <div className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 mr-2 shrink-0">
                            <Database size={9} />
                            MongoDB Atlas
                        </div>

                        {/* Feedback input */}
                        <input
                            type="text"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !feedback.trim() && handleApprove()}
                            placeholder="Optional note (required for OVERRIDE)..."
                            className="flex-1 bg-transparent border border-white/10 rounded px-3 py-1.5 font-mono text-[10px] text-white/70 placeholder:text-white/18 outline-none focus:border-white/22 transition-colors"
                        />

                        {/* AUTHORIZE */}
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleApprove}
                            disabled={isActing}
                            className="flex items-center gap-2 px-6 py-2 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                border: "1px solid rgba(57,255,20,0.45)",
                                background: "rgba(57,255,20,0.08)",
                                color: "#39ff14",
                                boxShadow: "0 0 12px rgba(57,255,20,0.08)",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(57,255,20,0.18)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(57,255,20,0.28)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(57,255,20,0.08)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 12px rgba(57,255,20,0.08)";
                            }}
                        >
                            {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                            AUTHORIZE
                        </motion.button>

                        {/* OVERRIDE */}
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleReject}
                            disabled={isActing || !feedback.trim()}
                            className="flex items-center gap-2 px-5 py-2 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                border: "1px solid rgba(255,45,85,0.4)",
                                background: "rgba(255,45,85,0.07)",
                                color: "#ff2d55",
                            }}
                            onMouseEnter={(e) => {
                                if (!feedback.trim()) return;
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,85,0.16)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(255,45,85,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,85,0.07)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                            }}
                        >
                            {isActing ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                            OVERRIDE
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
