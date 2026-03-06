"use client";

import React, { useEffect, useState } from "react";
import { useAgentStore } from "@/store/agent-store";
import { HitlCard, SupportCard, CampaignCard } from "./approval-card";
import type { DrawerItem } from "@/store/agent-store";
import { RefreshCw, Inbox } from "lucide-react";

type FilterTab = "all" | "hitl" | "support" | "campaign";

export const InboxView = () => {
    const {
        workflowPhase,
        threadId,
        missionMessage,
        pendingContent,
        supportTickets,
        campaignDrafts,
        fetchSupportTickets,
        fetchCampaignDrafts,
        setDrawerItem,
        setActiveView,
    } = useAgentStore();

    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [loading, setLoading] = useState(false);

    const hasHitl = workflowPhase === "AWAITING_APPROVAL" && threadId;
    const hitlTask = missionMessage ?? "Pending Report";
    const hitlPreview = pendingContent?.slice(0, 160) ?? "Report awaiting review...";

    const refresh = async () => {
        setLoading(true);
        await Promise.all([fetchSupportTickets(), fetchCampaignDrafts()]);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelect = (item: DrawerItem) => {
        setDrawerItem(item);
    };

    // Build filtered lists
    const showHitl     = activeTab === "all" || activeTab === "hitl";
    const showSupport  = activeTab === "all" || activeTab === "support";
    const showCampaign = activeTab === "all" || activeTab === "campaign";

    const hitlCount     = hasHitl ? 1 : 0;
    const supportCount  = supportTickets.length;
    const campaignCount = campaignDrafts.filter((c) => c.status === "AWAITING_APPROVAL").length;
    const totalCount    = hitlCount + supportCount + campaignCount;

    const tabs: { key: FilterTab; label: string; count: number }[] = [
        { key: "all",      label: "All",      count: totalCount    },
        { key: "hitl",     label: "HITL",     count: hitlCount     },
        { key: "support",  label: "Support",  count: supportCount  },
        { key: "campaign", label: "Campaign", count: campaignCount },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                    <Inbox size={14} className="text-white/40" />
                    <span className="font-mono text-[10px] font-bold text-white/60 uppercase tracking-widest">
                        Inbox
                    </span>
                    {totalCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-alert-red font-mono text-[7px] font-bold text-white">
                            {totalCount}
                        </span>
                    )}
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 py-2.5 border-b border-white/5 shrink-0">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[9px] tracking-wider transition-colors
                            ${activeTab === key
                                ? "bg-white/8 text-white/80"
                                : "text-white/30 hover:text-white/50 hover:bg-white/4"
                            }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className={`min-w-[14px] h-3.5 px-1 rounded-full font-mono text-[7px] flex items-center justify-center
                                ${activeTab === key ? "bg-white/20 text-white/90" : "bg-white/10 text-white/40"}`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Card list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 scrollbar-hide">
                {/* HITL */}
                {showHitl && hasHitl && threadId && (
                    <HitlCard
                        threadId={threadId}
                        task={hitlTask}
                        contentPreview={hitlPreview}
                        createdAt={new Date().toISOString()}
                        onSelect={handleSelect}
                    />
                )}

                {/* Support Tickets */}
                {showSupport && supportTickets.map((ticket) => (
                    <SupportCard key={ticket._id} ticket={ticket} onSelect={handleSelect} />
                ))}

                {/* Campaigns */}
                {showCampaign && campaignDrafts
                    .filter((c) => c.status === "AWAITING_APPROVAL")
                    .map((campaign) => (
                        <CampaignCard key={campaign._id} campaign={campaign} onSelect={handleSelect} />
                    ))}

                {/* Empty state */}
                {totalCount === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
                        <Inbox size={32} className="text-white/10" />
                        <div>
                            <p className="font-mono text-[11px] text-white/20">No pending items</p>
                            <p className="font-mono text-[9px] text-white/12 mt-1">
                                New missions and support tickets will appear here
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveView("chat")}
                            className="font-mono text-[9px] text-neon-blue/50 hover:text-neon-blue transition-colors mt-2"
                        >
                            ← Back to Command Center
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
