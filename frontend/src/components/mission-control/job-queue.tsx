"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, RefreshCw, Zap, Download,
    AlertTriangle, Bug, Megaphone, FileText,
    Clock, ChevronRight,
} from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import type { DrawerItem, SupportTicketSummary, CampaignDraftSummary, MissionSummary } from "@/store/agent-store";

type FilterTab = "all" | "hitl" | "support" | "campaign";

const PRIORITY_COLOR: Record<string, string> = {
    critical: "text-[#ff2d55] border-[#ff2d55]/40 bg-[#ff2d55]/8",
    high:     "text-[#ffb000] border-[#ffb000]/40 bg-[#ffb000]/8",
    medium:   "text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/8",
    low:      "text-white/40 border-white/15 bg-white/4",
};

/* ── HITL Card ── */
function HitlCard({ threadId, task, preview, createdAt, onSelect }: {
    threadId: string; task: string; preview: string; createdAt: string;
    onSelect: (item: DrawerItem) => void;
}) {
    const { drawerItem } = useAgentStore();
    const isActive = drawerItem?.type === "report" && drawerItem.threadId === threadId;
    return (
        <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect({ type: "report", threadId })}
            className={`w-full text-left rounded-lg border transition-all duration-150 overflow-hidden group
                ${isActive
                    ? "border-[#ff2d55]/50 bg-[#ff2d55]/8 shadow-[0_0_16px_rgba(255,45,85,0.12)]"
                    : "border-white/8 bg-white/3 hover:border-[#ff2d55]/30 hover:bg-[#ff2d55]/5"
                }`}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d55] animate-pulse shrink-0" />
                <span className="font-mono text-[8px] text-[#ff2d55] uppercase tracking-widest font-bold flex-1">HITL — Onay Bekliyor</span>
                <ChevronRight size={10} className={`text-white/25 transition-transform ${isActive ? "rotate-90 text-[#ff2d55]/60" : "group-hover:text-white/50"}`} />
            </div>
            <div className="px-3 py-2.5">
                <p className="font-mono text-[10px] text-white/80 font-semibold truncate mb-1">{task}</p>
                <p className="font-mono text-[9px] text-white/35 leading-relaxed line-clamp-2">{preview}</p>
                <p className="font-mono text-[8px] text-white/20 mt-2">{new Date(createdAt).toLocaleString("tr-TR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}</p>
            </div>
        </motion.button>
    );
}

/* ── Support Card ── */
function SupportCard({ ticket, onSelect }: {
    ticket: SupportTicketSummary; onSelect: (item: DrawerItem) => void;
}) {
    const { drawerItem } = useAgentStore();
    const isActive = drawerItem?.type === "support" && drawerItem.ticket._id === ticket._id;
    const isBug = ticket.category === "SUPPORT_BUG";
    const accentColor = isBug ? "#ff2d55" : "#00f0ff";
    const priorityClass = PRIORITY_COLOR[ticket.priority ?? "medium"];

    return (
        <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect({ type: "support", ticket })}
            className={`w-full text-left rounded-lg border transition-all duration-150 overflow-hidden group
                ${isActive
                    ? `border-[${accentColor}]/40 bg-[${accentColor}]/6`
                    : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                }`}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                {isBug ? <Bug size={9} style={{ color: accentColor }} /> : <AlertTriangle size={9} style={{ color: accentColor }} />}
                <span className="font-mono text-[8px] uppercase tracking-widest font-bold flex-1" style={{ color: accentColor }}>
                    {isBug ? "Support Bug" : "Support Pricing"}
                </span>
                {ticket.priority && (
                    <span className={`font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${priorityClass}`}>
                        {ticket.priority}
                    </span>
                )}
                <ChevronRight size={10} className="text-white/25 group-hover:text-white/50 transition-colors" />
            </div>
            <div className="px-3 py-2.5">
                <p className="font-mono text-[10px] text-white/80 font-semibold truncate mb-0.5">{ticket.subject}</p>
                <p className="font-mono text-[9px] text-white/40 truncate">{ticket.from}</p>
                {ticket.aiSummary && (
                    <p className="font-mono text-[8px] text-white/30 mt-1.5 line-clamp-2 leading-relaxed">{ticket.aiSummary}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[7px] text-white/25 uppercase bg-white/5 px-1.5 py-0.5 rounded">{ticket.platform}</span>
                    <span className="font-mono text-[7px] text-white/20">{new Date(ticket.createdAt).toLocaleString("tr-TR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}</span>
                </div>
            </div>
        </motion.button>
    );
}

/* ── Campaign Card ── */
function CampaignCard({ campaign, onSelect }: {
    campaign: CampaignDraftSummary; onSelect: (item: DrawerItem) => void;
}) {
    const { drawerItem } = useAgentStore();
    const isActive = drawerItem?.type === "campaign" && drawerItem.campaign._id === campaign._id;
    return (
        <motion.button
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect({ type: "campaign", campaign })}
            className={`w-full text-left rounded-lg border transition-all duration-150 overflow-hidden group
                ${isActive
                    ? "border-[#ff6b35]/40 bg-[#ff6b35]/6 shadow-[0_0_12px_rgba(255,107,53,0.1)]"
                    : "border-white/8 bg-white/3 hover:border-[#ff6b35]/25 hover:bg-[#ff6b35]/4"
                }`}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <Megaphone size={9} className="text-[#ff6b35]" />
                <span className="font-mono text-[8px] text-[#ff6b35] uppercase tracking-widest font-bold flex-1">CMO — Kampanya Taslağı</span>
                <div className="flex gap-1">
                    {["Li", "Tw", "Fb"].map(ch => (
                        <span key={ch} className="font-mono text-[6px] text-[#ff6b35]/60 bg-[#ff6b35]/10 px-1 py-0.5 rounded">{ch}</span>
                    ))}
                </div>
                <ChevronRight size={10} className="text-white/25 group-hover:text-white/50 transition-colors" />
            </div>
            <div className="px-3 py-2.5">
                <p className="font-mono text-[10px] text-white/80 font-semibold truncate mb-1">{campaign.reportTitle}</p>
                <p className="font-mono text-[8px] text-white/20">{new Date(campaign.createdAt).toLocaleString("tr-TR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}</p>
            </div>
        </motion.button>
    );
}

/* ── Archive Card ── */
function ArchiveCard({ mission, onSelect }: { mission: MissionSummary; onSelect: (item: DrawerItem) => void }) {
    return (
        <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => onSelect({ type: "mission", mission })}
            className="w-full text-left rounded-lg border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/10 transition-all px-3 py-2.5 group"
        >
            <div className="flex items-center gap-2">
                <FileText size={9} className="text-white/25 shrink-0" />
                <p className="font-mono text-[9px] text-white/45 truncate flex-1">{mission.task}</p>
                <span className={`font-mono text-[7px] uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${
                    mission.status === "PUBLISHED" ? "text-[#39ff14]/60 border-[#39ff14]/20 bg-[#39ff14]/5" :
                    mission.status === "REJECTED"  ? "text-[#ff2d55]/60 border-[#ff2d55]/20 bg-[#ff2d55]/5" :
                    "text-white/30 border-white/10"
                }`}>{mission.status}</span>
            </div>
        </motion.button>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export const JobQueue = () => {
    const {
        workflowPhase, threadId, missionMessage, pendingContent,
        missions, supportTickets, campaignDrafts,
        fetchSupportTickets, fetchCampaignDrafts, fetchMissions,
        setDrawerItem, sendMission, forceRdScan, pullLatestArtifact,
    } = useAgentStore();

    const [input, setInput] = useState("");
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const hasLiveHitl = workflowPhase === "AWAITING_APPROVAL" && !!threadId;
    const dbHitlMissions = missions.filter(m => m.status === "AWAITING_APPROVAL" && m.threadId !== threadId);
    const pendingCampaigns = campaignDrafts.filter(c => c.status === "AWAITING_APPROVAL");

    const counts = {
        hitl:     (hasLiveHitl ? 1 : 0) + dbHitlMissions.length,
        support:  supportTickets.length,
        campaign: pendingCampaigns.length,
    };
    const total = counts.hitl + counts.support + counts.campaign;

    const refresh = async () => {
        setLoading(true);
        await Promise.all([fetchSupportTickets(), fetchCampaignDrafts(), fetchMissions()]);
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        const msg = input.trim();
        setInput("");
        setSending(true);
        await sendMission(msg);
        setSending(false);
    };

    const handleSelect = (item: DrawerItem) => setDrawerItem(item);

    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: "all",      label: "Tümü",    count: total          },
        { key: "hitl",     label: "HITL",    count: counts.hitl    },
        { key: "support",  label: "Destek",  count: counts.support },
        { key: "campaign", label: "Kampanya",count: counts.campaign },
    ];

    const showHitl     = activeTab === "all" || activeTab === "hitl";
    const showSupport  = activeTab === "all" || activeTab === "support";
    const showCampaign = activeTab === "all" || activeTab === "campaign";

    const publishedMissions = missions.filter(m => m.status === "PUBLISHED" || m.status === "APPROVED").slice(0, 8);

    return (
        <aside
            className="w-[360px] shrink-0 flex flex-col h-screen overflow-hidden"
            style={{ background: "#0b1220", borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
            {/* ── Header ── */}
            <div className="px-4 py-3 border-b border-white/8 shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-white/35 uppercase tracking-widest font-semibold">Ops Queue</span>
                        {total > 0 && (
                            <span className="min-w-[18px] h-4 px-1.5 rounded-full bg-[#ff2d55] font-mono text-[8px] font-bold text-white flex items-center justify-center">
                                {total}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={refresh}
                        disabled={loading}
                        className="p-1.5 rounded-md hover:bg-white/8 text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
                    >
                        <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Mission Input */}
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Yeni görev ver... (Enter ile gönder)"
                        rows={3}
                        className="w-full bg-white/4 border border-white/10 rounded-lg px-3 py-2.5 pr-10 font-mono text-[10px] text-white/75
                                   placeholder:text-white/20 outline-none focus:border-[#00f0ff]/30 focus:bg-white/5 resize-none
                                   transition-colors leading-relaxed"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="absolute bottom-2.5 right-2.5 p-1.5 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff]/70
                                   hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={10} className={sending ? "animate-pulse" : ""} />
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={forceRdScan}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-mono text-[8px] font-semibold uppercase tracking-wider
                                   border border-[#39ff14]/20 text-[#39ff14]/60 hover:bg-[#39ff14]/8 hover:border-[#39ff14]/40 hover:text-[#39ff14] transition-all"
                    >
                        <Zap size={9} /> R&D Radar
                    </button>
                    <button
                        onClick={pullLatestArtifact}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-mono text-[8px] font-semibold uppercase tracking-wider
                                   border border-white/12 text-white/40 hover:bg-white/5 hover:border-white/20 hover:text-white/60 transition-all"
                    >
                        <Download size={9} /> Son Raporu Çek
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 px-3 py-2.5 border-b border-white/6 shrink-0">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[8px] font-semibold tracking-wider transition-colors
                            ${activeTab === key
                                ? "bg-[#00f0ff]/12 border border-[#00f0ff]/25 text-[#00f0ff]"
                                : "text-white/40 hover:text-white/65 hover:bg-white/5 border border-transparent"
                            }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className={`min-w-[14px] h-[14px] px-1 rounded-full font-mono text-[7px] flex items-center justify-center font-bold
                                ${activeTab === key ? "bg-[#00f0ff]/20 text-[#00f0ff]" : "bg-white/10 text-white/50"}`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Card List ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {/* Live HITL */}
                    {showHitl && hasLiveHitl && threadId && (
                        <HitlCard
                            key={`live-${threadId}`}
                            threadId={threadId}
                            task={missionMessage ?? "Aktif Görev"}
                            preview={pendingContent?.slice(0, 150) ?? "Rapor hazırlanıyor..."}
                            createdAt={new Date().toISOString()}
                            onSelect={handleSelect}
                        />
                    )}

                    {/* DB HITL */}
                    {showHitl && dbHitlMissions.map(m => (
                        <HitlCard
                            key={m.threadId}
                            threadId={m.threadId}
                            task={m.task}
                            preview={m.contentPreview}
                            createdAt={m.createdAt}
                            onSelect={handleSelect}
                        />
                    ))}

                    {/* Support */}
                    {showSupport && supportTickets.map(t => (
                        <SupportCard key={t._id} ticket={t} onSelect={handleSelect} />
                    ))}

                    {/* Campaigns */}
                    {showCampaign && pendingCampaigns.map(c => (
                        <CampaignCard key={c._id} campaign={c} onSelect={handleSelect} />
                    ))}
                </AnimatePresence>

                {/* Empty pending state */}
                {total === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <div className="w-10 h-10 rounded-xl border border-white/8 flex items-center justify-center text-white/15 text-lg">◫</div>
                        <p className="font-mono text-[9px] text-white/25">Bekleyen öğe yok</p>
                    </div>
                )}

                {/* Archive divider */}
                {publishedMissions.length > 0 && (activeTab === "all" || activeTab === "hitl") && (
                    <>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-px bg-white/6" />
                            <span className="font-mono text-[7px] text-white/20 uppercase tracking-widest flex items-center gap-1">
                                <Clock size={7} /> Arşiv
                            </span>
                            <div className="flex-1 h-px bg-white/6" />
                        </div>
                        {publishedMissions.map(m => (
                            <ArchiveCard key={m.threadId} mission={m} onSelect={handleSelect} />
                        ))}
                    </>
                )}
            </div>
        </aside>
    );
};
