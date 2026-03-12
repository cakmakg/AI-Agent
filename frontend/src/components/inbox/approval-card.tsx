"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ShieldAlert, Mail, Megaphone, ChevronRight,
    Youtube, Instagram, Twitter, Slack, Globe, MessageSquare, Music2,
} from "lucide-react";
import type { SupportTicketSummary, CampaignDraftSummary, DrawerItem } from "@/store/agent-store";

// ── Platform icon mapping ───────────────────────────────────────────────────
const PLATFORM_ICONS: Record<string, React.ElementType> = {
    gmail:     Mail,
    youtube:   Youtube,
    slack:     Slack,
    instagram: Instagram,
    twitter:   Twitter,
    tiktok:    Music2,
    discord:   MessageSquare,
};

// ── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
    critical: { label: "CRITICAL", text: "text-alert-red",   bg: "bg-alert-red/15 border border-alert-red/30"   },
    high:     { label: "HIGH",     text: "text-amber-400",   bg: "bg-amber-400/15 border border-amber-400/30"   },
    medium:   { label: "MED",      text: "text-neon-blue",   bg: "bg-neon-blue/15 border border-neon-blue/30"   },
    low:      { label: "LOW",      text: "text-white/40",    bg: "bg-white/8 border border-white/15"            },
} as const;

// ── n8n category human-readable labels ─────────────────────────────────────
const N8N_LABELS: Record<string, string> = {
    ACIL_DESTEK:         "Acil Destek",
    SIKAYET_IADE:        "Şikayet / İade",
    FIYAT_SORUSTURMASI:  "Fiyat Sorusu",
    TEKLIF_TALEBI:       "Teklif Talebi",
    IHTIYAC_ANALIZI:     "İhtiyaç Analizi",
    GENEL_BILGI:         "Genel Bilgi",
};

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

export const SupportCard = ({ ticket, onSelect }: SupportCardProps) => {
    const platform = (ticket.platform || "gmail").toLowerCase();
    const PlatformIcon = PLATFORM_ICONS[platform] ?? Globe;
    const priority = ticket.priority ?? "medium";
    const pCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
    const categoryLabel = ticket.n8nCategory
        ? (N8N_LABELS[ticket.n8nCategory] ?? ticket.n8nCategory)
        : (ticket.category === "SUPPORT_BUG" ? "Bug Report" : "Pricing");
    const displayName = ticket.author || ticket.from;
    const preview = ticket.aiSummary || ticket.subject;

    const borderColor = priority === "critical"
        ? "border-l-alert-red/60 hover:border-l-alert-red hover:bg-alert-red/4"
        : priority === "high"
        ? "border-l-amber-400/60 hover:border-l-amber-400 hover:bg-amber-400/4"
        : "border-l-neon-blue/40 hover:border-l-neon-blue hover:bg-neon-blue/3";

    return (
        <motion.button
            whileHover={{ x: 2 }}
            onClick={() => onSelect({ type: "support", ticket })}
            className={`w-full text-left glass-panel rounded-lg p-4 border-l-2 ${borderColor} transition-all duration-150 group`}
        >
            <div className="flex items-start gap-3">
                <PlatformIcon size={14} className="text-neon-blue shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    {/* Header: category + priority badge + time */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-neon-blue/70 font-bold">
                            {categoryLabel}
                        </span>
                        <span className={`font-mono text-[7px] font-bold px-1.5 py-0.5 rounded ${pCfg.bg} ${pCfg.text}`}>
                            {pCfg.label}
                        </span>
                        <span className="font-mono text-[7px] text-white/25 ml-auto">
                            {new Date(ticket.createdAt).toLocaleTimeString("en-GB", { hour12: false })}
                        </span>
                    </div>
                    {/* Subject or AI summary */}
                    <p className="font-mono text-[11px] text-white/80 truncate mb-0.5">{preview}</p>
                    {/* Sender + platform tag */}
                    <div className="flex items-center gap-2">
                        <p className="font-mono text-[9px] text-white/35 truncate">{displayName}</p>
                        {platform !== "gmail" && (
                            <span className="font-mono text-[7px] text-white/20 uppercase tracking-wider">{platform}</span>
                        )}
                    </div>
                </div>
                <ChevronRight size={12} className="text-white/20 group-hover:text-white/50 shrink-0 mt-1 transition-colors" />
            </div>
        </motion.button>
    );
};

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
