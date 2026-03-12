"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Code2, Layers, GitBranch } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAgentStore } from "@/store/agent-store";

interface Props {
    threadId: string;
}

export const BlueprintViewer = ({ threadId }: Props) => {
    const { pendingContent, approveMission, rejectMission, workflowPhase, setDrawerItem } = useAgentStore();
    const [feedback, setFeedback] = useState("");
    const [rejectMode, setRejectMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const content = pendingContent ?? "";
    const isPublishing = workflowPhase === "PUBLISHING" || workflowPhase === "DELIVERED";

    const handleApprove = async () => {
        setSubmitting(true);
        await approveMission(feedback || undefined);
        setSubmitting(false);
        setDrawerItem(null);
    };

    const handleReject = async () => {
        if (!feedback.trim()) return;
        setSubmitting(true);
        await rejectMission(feedback);
        setSubmitting(false);
        setRejectMode(false);
        setFeedback("");
        setDrawerItem(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neon-blue/10 shrink-0"
                style={{ background: "rgba(0,240,255,0.03)" }}>
                <Code2 size={13} className="text-neon-blue/70 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-[8px] text-neon-blue/60 uppercase tracking-widest">Technical Blueprint</p>
                    <p className="font-mono text-[10px] text-white/70 truncate mt-0.5">
                        Blueprint: {threadId.slice(0, 16)}...
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Layers size={10} className="text-neon-blue/40" />
                    <GitBranch size={10} className="text-neon-green/40" />
                </div>
            </div>

            {/* Architecture indicators */}
            <div className="flex gap-1.5 px-4 py-2 border-b border-neon-blue/8 shrink-0">
                {["Architect", "System Design", "Tech Stack"].map((tag) => (
                    <span key={tag}
                        className="px-2 py-0.5 rounded font-mono text-[7px] uppercase tracking-wider
                                   bg-neon-blue/6 border border-neon-blue/15 text-neon-blue/60">
                        {tag}
                    </span>
                ))}
                <span className="ml-auto font-mono text-[8px] text-neon-green/50 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                    CTO
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
                {content ? (
                    <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-mono prose-headings:text-neon-blue/80 prose-headings:text-xs
                        prose-h1:text-neon-blue prose-h1:border-b prose-h1:border-neon-blue/20 prose-h1:pb-2
                        prose-h2:text-neon-blue/70 prose-h2:border-b prose-h2:border-neon-blue/10 prose-h2:pb-1
                        prose-h3:text-neon-blue/60
                        prose-p:text-white/60 prose-p:text-[11px] prose-p:leading-relaxed
                        prose-code:text-neon-green prose-code:text-[10px] prose-code:bg-[rgba(0,240,255,0.04)]
                        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border
                        prose-code:border-neon-blue/10
                        prose-pre:bg-[#0a1628] prose-pre:border prose-pre:border-neon-blue/15 prose-pre:rounded-lg
                        prose-strong:text-neon-blue/80
                        prose-li:text-white/60 prose-li:text-[11px]
                        prose-a:text-neon-blue prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-neon-blue prose-blockquote:text-white/40
                        prose-hr:border-neon-blue/15
                        prose-table:text-[10px] prose-th:text-neon-blue/70 prose-td:text-white/55">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "");
                                    const isInline = !match;
                                    if (isInline) {
                                        return (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                    return (
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            customStyle={{
                                                background: "#0a1628",
                                                border: "1px solid rgba(0,240,255,0.12)",
                                                borderRadius: "8px",
                                                fontSize: "10px",
                                                lineHeight: "1.6",
                                            }}
                                        >
                                            {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                    );
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32 gap-2 text-neon-blue/25">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="font-mono text-[10px]">Loading blueprint...</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isPublishing && (
                <div className="px-4 py-3 border-t border-neon-blue/8 shrink-0 space-y-2"
                    style={{ background: "rgba(0,240,255,0.02)" }}>
                    {rejectMode ? (
                        <>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Revision notes (required)..."
                                className="w-full bg-white/4 border border-white/10 rounded px-3 py-2 font-mono text-[10px] text-white/70
                                           placeholder:text-white/20 outline-none focus:border-alert-red/40 resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReject}
                                    disabled={!feedback.trim() || submitting}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                               bg-alert-red/10 border border-alert-red/40 text-alert-red hover:bg-alert-red/20
                                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? <Loader2 size={10} className="animate-spin" /> : <XCircle size={10} />}
                                    Request Revision
                                </button>
                                <button
                                    onClick={() => { setRejectMode(false); setFeedback(""); }}
                                    className="px-4 py-2 rounded font-mono text-[9px] text-white/40 border border-white/10 hover:border-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <input
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Optional deployment notes..."
                                className="w-full bg-neon-blue/3 border border-neon-blue/10 rounded px-3 py-2 font-mono text-[10px] text-white/70
                                           placeholder:text-white/20 outline-none focus:border-neon-blue/30 transition-colors"
                            />
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleApprove}
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                               bg-neon-green/10 border border-neon-green/40 text-neon-green hover:bg-neon-green/20
                                               hover:border-neon-green/60 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]
                                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                    Deploy Blueprint
                                </motion.button>
                                <button
                                    onClick={() => setRejectMode(true)}
                                    className="px-4 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                               border border-alert-red/30 text-alert-red/60 hover:bg-alert-red/8 hover:border-alert-red/50 transition-all"
                                >
                                    <XCircle size={10} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {isPublishing && (
                <div className="px-4 py-4 border-t border-neon-blue/8 shrink-0 flex items-center justify-center gap-2"
                    style={{ background: "rgba(0,240,255,0.02)" }}>
                    <Loader2 size={12} className="animate-spin text-neon-blue" />
                    <span className="font-mono text-[10px] text-neon-blue">Deploying blueprint...</span>
                </div>
            )}
        </div>
    );
};
