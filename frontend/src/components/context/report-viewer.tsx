"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAgentStore } from "@/store/agent-store";

interface Props {
    threadId: string;
}

export const ReportViewer = ({ threadId }: Props) => {
    const { pendingContent, threadId: storeThreadId, approveMission, rejectMission, workflowPhase, setDrawerItem, apiKey } = useAgentStore();
    const [feedback, setFeedback] = useState("");
    const [rejectMode, setRejectMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchedContent, setFetchedContent] = useState<string | null>(null);
    const [fetching, setFetching] = useState(false);

    // Sync store threadId when viewing a DB report (so Authorize uses correct threadId)
    useEffect(() => {
        if (threadId && threadId !== storeThreadId) {
            useAgentStore.setState({
                threadId,
                workflowPhase: "AWAITING_APPROVAL",
                missionCategory: "HOT_LEAD",
            });
        }
    }, [threadId, storeThreadId]);

    // Auto-fetch content from MongoDB when pendingContent is empty for this thread
    useEffect(() => {
        if (pendingContent?.trim()) {
            setFetchedContent(null);
            return;
        }
        setFetching(true);
        setFetchedContent(null);
        const headers: Record<string, string> = {};
        if (apiKey) headers["x-api-key"] = apiKey;
        fetch("/api/artifact/" + threadId, { headers })
            .then((r) => r.json())
            .then((data) => {
                const text = (data.content || "").trim();
                setFetchedContent(text || "*(Icerik bulunamadi)*");
                if (text) {
                    useAgentStore.setState({ pendingContent: text, workflowPhase: "AWAITING_APPROVAL" });
                }
            })
            .catch(() => setFetchedContent("*(Icerik yuklenemedi)*"))
            .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);

    const content = (pendingContent || "").trim() || fetchedContent || "";
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
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
                <FileText size={13} className="text-alert-red/70 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-[8px] text-alert-red/60 uppercase tracking-widest">HITL Gate</p>
                    <p className="font-mono text-[10px] text-white/70 truncate mt-0.5">
                        Thread: {threadId.slice(0, 16)}...
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
                {fetching ? (
                    <div className="flex items-center justify-center h-32 gap-2 text-white/25">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="font-mono text-[10px]">Loading report from database...</span>
                    </div>
                ) : content ? (
                    <div className="prose prose-invert prose-sm max-w-none
                        prose-headings:font-mono prose-headings:text-white/80 prose-headings:text-xs
                        prose-p:text-white/60 prose-p:text-[11px] prose-p:leading-relaxed
                        prose-code:text-neon-green prose-code:text-[10px] prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                        prose-pre:bg-white/4 prose-pre:border prose-pre:border-white/8 prose-pre:rounded-lg
                        prose-strong:text-white/85 prose-li:text-white/60 prose-li:text-[11px]
                        prose-a:text-neon-blue prose-blockquote:border-neon-blue/30 prose-blockquote:text-white/40">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32 gap-2 text-white/25">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="font-mono text-[10px]">Loading report...</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isPublishing && (
                <div className="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                    {rejectMode ? (
                        <>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Rejection reason (required)..."
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
                                    Override
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
                                placeholder="Optional feedback note..."
                                className="w-full bg-white/4 border border-white/10 rounded px-3 py-2 font-mono text-[10px] text-white/70
                                           placeholder:text-white/20 outline-none focus:border-neon-green/30"
                            />
                            <div className="flex gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleApprove}
                                    disabled={submitting || fetching}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                               bg-neon-green/10 border border-neon-green/40 text-neon-green hover:bg-neon-green/20
                                               hover:border-neon-green/60 hover:shadow-[0_0_20px_rgba(57,255,20,0.15)]
                                               disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                    Authorize
                                </motion.button>
                                <button
                                    onClick={() => setRejectMode(true)}
                                    className="px-4 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                               border border-alert-red/30 text-alert-red/60 hover:bg-alert-red/8 hover:border-alert-red/50 transition-all"
                                >
                                    Override
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {isPublishing && (
                <div className="px-4 py-4 border-t border-white/5 shrink-0 flex items-center justify-center gap-2">
                    <Loader2 size={12} className="animate-spin text-neon-blue" />
                    <span className="font-mono text-[10px] text-neon-blue">Publishing payload...</span>
                </div>
            )}
        </div>
    );
};
