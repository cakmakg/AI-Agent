"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, XCircle, Loader2, Megaphone } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAgentStore } from "@/store/agent-store";
import type { CampaignDraftSummary } from "@/store/agent-store";

interface Props {
    campaign: CampaignDraftSummary;
}

export const CampaignViewer = ({ campaign }: Props) => {
    const { approveCampaign, setDrawerItem } = useAgentStore();
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");

    const handleLaunch = async () => {
        setSubmitting(true);
        await approveCampaign(campaign._id, true, feedback || undefined);
        setSubmitting(false);
        setDrawerItem(null);
    };

    const handleReject = async () => {
        setSubmitting(true);
        await approveCampaign(campaign._id, false, feedback || undefined);
        setSubmitting(false);
        setDrawerItem(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
                <Megaphone size={13} className="text-[#ff6b35]/70 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-[8px] text-[#ff6b35]/60 uppercase tracking-widest">Campaign Draft</p>
                    <p className="font-mono text-[10px] text-white/70 truncate mt-0.5">{campaign.reportTitle}</p>
                </div>
            </div>

            {/* Channel badges */}
            <div className="flex gap-1.5 px-4 py-2.5 border-b border-white/5 shrink-0">
                {["LinkedIn", "Twitter/X", "Meta Ads"].map((ch) => (
                    <span key={ch} className="px-2.5 py-1 rounded-full font-mono text-[7px] uppercase tracking-wider
                                              bg-[#ff6b35]/8 border border-[#ff6b35]/20 text-[#ff6b35]/70">
                        {ch}
                    </span>
                ))}
                <span className="ml-auto font-mono text-[8px] text-white/25">
                    {new Date(campaign.createdAt).toLocaleDateString("en-GB")}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
                <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:font-mono prose-headings:text-white/70 prose-headings:text-xs
                    prose-p:text-white/55 prose-p:text-[10px] prose-p:leading-relaxed
                    prose-code:text-[#ff6b35] prose-code:text-[10px] prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                    prose-strong:text-white/80 prose-li:text-white/55 prose-li:text-[10px]
                    prose-h2:border-b prose-h2:border-[#ff6b35]/15 prose-h2:pb-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {campaign.campaignContent}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                <input
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Optional feedback note..."
                    className="w-full bg-white/3 border border-white/8 rounded px-3 py-2 font-mono text-[10px] text-white/70
                               placeholder:text-white/20 outline-none focus:border-[#ff6b35]/25"
                />
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLaunch}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                   bg-[#ff6b35]/10 border border-[#ff6b35]/40 text-[#ff6b35] hover:bg-[#ff6b35]/20
                                   hover:shadow-[0_0_15px_rgba(255,107,53,0.15)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        {submitting ? <Loader2 size={10} className="animate-spin" /> : <Rocket size={10} />}
                        Launch Campaign
                    </motion.button>
                    <button
                        onClick={handleReject}
                        disabled={submitting}
                        className="px-4 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                                   border border-alert-red/30 text-alert-red/60 hover:bg-alert-red/8 hover:border-alert-red/50
                                   disabled:opacity-30 transition-all"
                    >
                        <XCircle size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
};
