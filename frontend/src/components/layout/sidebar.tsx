"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    Inbox,
    BarChart3,
    BookOpen,
    Network,
    Settings,
    Blocks,
} from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import type { ActiveView, AgentId } from "@/store/agent-store";
import { CronTimer } from "@/components/hud/cron-timer";

const NAV_ITEMS: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
    { view: "chat", label: "Command Center", icon: <MessageSquare size={15} /> },
    { view: "inbox", label: "Inbox", icon: <Inbox size={15} /> },
    { view: "cfo", label: "CFO Dashboard", icon: <BarChart3 size={15} /> },
    { view: "knowledge", label: "Knowledge Base", icon: <BookOpen size={15} /> },
    { view: "topology", label: "Agent Topology", icon: <Network size={15} /> },
    { view: "skills", label: "Skill Store", icon: <Blocks size={15} /> },
    { view: "settings", label: "Client Settings", icon: <Settings size={15} /> },
];

const STATUS_COLOR: Record<string, string> = {
    IDLE: "bg-white/30",
    THINKING: "bg-neon-blue animate-pulse",
    ACTIVE: "bg-neon-green animate-pulse",
    SUCCESS: "bg-neon-green",
    ERROR: "bg-alert-red",
};

const SIDEBAR_AGENTS: AgentId[] = ["ceo", "cto", "scraper", "analyst", "writer", "qa", "hitl", "publisher", "radar", "cmo", "cfo"];

export const Sidebar = () => {
    const { activeView, setActiveView, agents, workflowPhase, supportTickets, campaignDrafts } = useAgentStore();

    const pendingInboxCount =
        supportTickets.filter((t) => t.category === "SUPPORT_PRICING" || t.category === "SUPPORT_BUG").length +
        campaignDrafts.filter((c) => c.status === "AWAITING_APPROVAL").length +
        (workflowPhase === "AWAITING_APPROVAL" ? 1 : 0);

    return (
        <aside className="w-[230px] shrink-0 flex flex-col h-screen border-r border-white/10 overflow-hidden"
            style={{ background: "#0d1829" }}>
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-neon-blue/50 flex items-center justify-center text-neon-blue text-base font-bold bg-neon-blue/10">
                        ◈
                    </div>
                    <div>
                        <div className="font-mono text-[12px] font-bold text-white tracking-wider">AI Orchestra</div>
                        <div className="font-mono text-[9px] text-white/50 tracking-widest uppercase">Command Center</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1 px-2 py-3 border-b border-white/10">
                {NAV_ITEMS.map(({ view, label, icon }) => {
                    const isActive = activeView === view;
                    const badge = view === "inbox" && pendingInboxCount > 0 ? pendingInboxCount : null;

                    return (
                        <motion.button
                            key={view}
                            whileHover={{ x: 2 }}
                            onClick={() => setActiveView(view)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150
                                ${isActive
                                    ? "bg-neon-blue/15 border border-neon-blue/30 text-neon-blue shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                                    : "text-white/65 hover:text-white hover:bg-white/8 border border-transparent"
                                }`}
                        >
                            <span className={isActive ? "text-neon-blue" : "text-white/50"}>
                                {icon}
                            </span>
                            <span className="font-mono text-[11px] font-medium tracking-wide flex-1">{label}</span>
                            {badge !== null && (
                                <span className="min-w-[18px] h-5 px-1.5 rounded-full bg-alert-red flex items-center justify-center font-mono text-[9px] font-bold text-white">
                                    {badge}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Agents */}
            <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide">
                <div className="font-mono text-[9px] text-white/45 uppercase tracking-widest px-2 mb-2 font-semibold">
                    Live Agents
                </div>
                <div className="flex flex-col gap-0.5">
                    {SIDEBAR_AGENTS.map((id) => {
                        const agent = agents[id];
                        return (
                            <div key={id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLOR[agent.status]}`} />
                                <span className="font-mono text-[11px] text-white/75 flex-1 truncate">
                                    {agent.icon} {agent.shortLabel}
                                </span>
                                <span className={`font-mono text-[8px] uppercase tracking-wider font-semibold ${
                                    agent.status === "ACTIVE" ? "text-neon-green" :
                                    agent.status === "THINKING" ? "text-neon-blue" :
                                    agent.status === "ERROR" ? "text-alert-red" :
                                    agent.status === "SUCCESS" ? "text-neon-green/70" :
                                    "text-white/30"
                                }`}>
                                    {agent.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cron Timer */}
            <div className="p-2 border-t border-white/10">
                <CronTimer />
            </div>
        </aside>
    );
};
