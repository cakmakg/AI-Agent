"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Mail, Megaphone, ChevronRight } from "lucide-react";
import type { SupportTicketSummary, CampaignDraftSummary, DrawerItem } from "@/store/agent-store";

// ── HITL Card ──────────────────────────────────────────────────────────────
interface HitlCardProps {
    threadId: string;
    task: string;
    contentPreview: string;
    createdAt: string;
    onSelect: (item: DrawerItem) => void;
}

export const HitlCard = ({ threadId, task, contentPreview, createdAt, onSelect }: HitlCardProps) => (
    <motion.button
        whileHover={{ x: 2 }}
        onClick={() => onSelect({ type: "report", threadId })}
        className="w-full text-left glass-panel rounded-lg p-4 border-l-2 border-l-alert-red/60 hover:border-l-alert-red
                   hover:bg-alert-red/4 transition-all duration-150 group"
    >
        <div className="flex items-start gap-3">
            <ShieldAlert size={14} className="text-alert-red shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-alert-red/80 font-bold">
                        HITL Gate
                    </span>
                    <span className="font-mono text-[7px] text-white/25">
                        {new Date(createdAt).toLocaleTimeString("en-GB", { hour12: false })}
                    </span>
                </div>
                <p className="font-mono text-[11px] text-white/80 truncate mb-1">{task}</p>
                <p className="font-mono text-[9px] text-white/35 line-clamp-2 leading-relaxed">{contentPreview}</p>
            </div>
            <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" />
        </div>
    </motion.button>
);

// ── Support Ticket Card ────────────────────────────────────────────────────
interface SupportCardProps {
    ticket: SupportTicketSummary;
    onSelect: (item: DrawerItem) => void;
}

export const SupportCard = ({ ticket, onSelect }: SupportCardProps) => (
    <motion.button
        whileHover={{ x: 2 }}
        onClick={() => onSelect({ type: "support", ticket })}
        className="w-full text-left glass-panel rounded-lg p-4 border-l-2 border-l-neon-blue/40 hover:border-l-neon-blue
                   hover:bg-neon-blue/3 transition-all duration-150 group"
    >
        <div className="flex items-start gap-3">
            <Mail size={14} className="text-neon-blue shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-neon-blue/70 font-bold">
                        {ticket.category === "SUPPORT_BUG" ? "Bug Report" : "Pricing"}
                    </span>
                    <span className="font-mono text-[7px] text-white/25">
                        {new Date(ticket.createdAt).toLocaleTimeString("en-GB", { hour12: false })}
                    </span>
                </div>
                <p className="font-mono text-[11px] text-white/80 truncate mb-1">{ticket.subject}</p>
                <p className="font-mono text-[9px] text-white/35 truncate">{ticket.from}</p>
            </div>
            <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" />
        </div>
    </motion.button>
);

// ── Campaign Card ──────────────────────────────────────────────────────────
interface CampaignCardProps {
    campaign: CampaignDraftSummary;
    onSelect: (item: DrawerItem) => void;
}

export const CampaignCard = ({ campaign, onSelect }: CampaignCardProps) => (
    <motion.button
        whileHover={{ x: 2 }}
        onClick={() => onSelect({ type: "campaign", campaign })}
        className="w-full text-left glass-panel rounded-lg p-4 border-l-2 border-l-[#ff6b35]/40 hover:border-l-[#ff6b35]
                   hover:bg-[#ff6b35]/4 transition-all duration-150 group"
    >
        <div className="flex items-start gap-3">
            <Megaphone size={14} className="text-[#ff6b35] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-[#ff6b35]/80 font-bold">
                        Campaign
                    </span>
                    <span className="font-mono text-[7px] text-white/25">
                        {new Date(campaign.createdAt).toLocaleTimeString("en-GB", { hour12: false })}
                    </span>
                </div>
                <p className="font-mono text-[11px] text-white/80 truncate mb-1">{campaign.reportTitle}</p>
                <p className="font-mono text-[9px] text-white/35">LinkedIn · Twitter · Meta Ads</p>
            </div>
            <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" />
        </div>
    </motion.button>
);
