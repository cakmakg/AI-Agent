"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, XCircle, Loader2, Mail } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import type { SupportTicketSummary } from "@/store/agent-store";

interface Props {
    ticket: SupportTicketSummary;
}

export const EmailViewer = ({ ticket }: Props) => {
    const { approveSupportTicket, setDrawerItem } = useAgentStore();
    const [draft, setDraft] = useState(ticket.draftResponse);
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        setSubmitting(true);
        await approveSupportTicket(ticket._id, true, draft);
        setSubmitting(false);
        setDrawerItem(null);
    };

    const handleReject = async () => {
        setSubmitting(true);
        await approveSupportTicket(ticket._id, false);
        setSubmitting(false);
        setDrawerItem(null);
    };

    const categoryColor = ticket.category === "SUPPORT_BUG"
        ? "text-alert-red/70 border-alert-red/20"
        : "text-neon-blue/70 border-neon-blue/20";

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0">
                <Mail size={13} className="text-neon-blue/60 shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-mono text-[8px] text-neon-blue/50 uppercase tracking-widest">Support Ticket</p>
                    <p className="font-mono text-[10px] text-white/70 truncate mt-0.5">{ticket.subject}</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Original email */}
                <div className="px-4 py-3 border-b border-white/5">
                    <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-white/25 w-10 shrink-0">FROM</span>
                            <span className="font-mono text-[10px] text-white/60">{ticket.from}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-white/25 w-10 shrink-0">SUBJ</span>
                            <span className="font-mono text-[10px] text-white/70 truncate">{ticket.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-white/25 w-10 shrink-0">TYPE</span>
                            <span className={`font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColor}`}>
                                {ticket.category === "SUPPORT_BUG" ? "Bug Report" : "Pricing"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[8px] text-white/25 w-10 shrink-0">DATE</span>
                            <span className="font-mono text-[9px] text-white/30">
                                {new Date(ticket.createdAt).toLocaleString("en-GB", { hour12: false })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Draft editor */}
                <div className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                        <span className="font-mono text-[8px] text-neon-green/70 uppercase tracking-wider">AI Draft Response</span>
                    </div>
                    <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2.5 font-mono text-[10px] text-white/70
                                   placeholder:text-white/20 outline-none focus:border-neon-green/25 resize-none leading-relaxed
                                   scrollbar-hide"
                        rows={12}
                    />
                    <p className="font-mono text-[8px] text-white/20 mt-1.5">Edit before sending · Changes are not saved automatically</p>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-white/5 shrink-0 flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSend}
                    disabled={submitting || !draft.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider
                               bg-neon-green/10 border border-neon-green/40 text-neon-green hover:bg-neon-green/20
                               hover:shadow-[0_0_15px_rgba(57,255,20,0.12)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    {submitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                    Send Reply
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
    );
};
