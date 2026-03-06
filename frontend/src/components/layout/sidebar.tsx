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
    { view: "chat", label: "Command Center", icon: <MessageSquare size={14} /> },
    { view: "inbox", label: "Inbox", icon: <Inbox size={14} /> },
    { view: "cfo", label: "CFO Dashboard", icon: <BarChart3 size={14} /> },
    { view: "knowledge", label: "Knowledge Base", icon: <BookOpen size={14} /> },
    { view: "topology", label: "Agent Topology", icon: <Network size={14} /> },
    { view: "skills", label: "Skill Store", icon: <Blocks size={14} /> },
    { view: "settings", label: "Client Settings", icon: <Settings size={14} /> },
];

const STATUS_COLOR: Record<string, string> = {
    IDLE: "bg-white/20",
    THINKING: "bg-neon-blue animate-pulse",
    ACTIVE: "bg-neon-green animate-pulse",
    SUCCESS: "bg-neon-green",
    ERROR: "bg-alert-red",
};

// Agents to show in sidebar (compact list)
const SIDEBAR_AGENTS: AgentId[] = ["ceo", "cto", "scraper", "analyst", "writer", "qa", "hitl", "publisher", "radar", "cmo", "cfo"];

export const Sidebar = () => {
    const { activeView, setActiveView, agents, workflowPhase, supportTickets, campaignDrafts } = useAgentStore();

    const pendingInboxCount =
        supportTickets.filter((t) => t.category === "SUPPORT_PRICING" || t.category === "SUPPORT_BUG").length +
        campaignDrafts.filter((c) => c.status === "AWAITING_APPROVAL").length +
        (workflowPhase === "AWAITING_APPROVAL" ? 1 : 0);

    return (
        <aside className="w-[220px] shrink-0 flex flex-col h-screen bg-[rgba(9,14,26,0.95)] border-r border-white/5 overflow-hidden">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded border border-neon-blue/40 flex items-center justify-center text-neon-blue text-sm font-bold">
                        ◈
                    </div>
                    <div>
                        <div className="font-mono text-[11px] font-bold text-white tracking-wider">AI Orchestra</div>
                        <div className="font-mono text-[8px] text-white/30 tracking-widest uppercase">Command Center</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-0.5 px-2 py-3 border-b border-white/5">
                {NAV_ITEMS.map(({ view, label, icon }) => {
                    const isActive = activeView === view;
                    const badge = view === "inbox" && pendingInboxCount > 0 ? pendingInboxCount : null;

                    return (
                        <motion.button
                            key={view}
                            whileHover={{ x: 2 }}
                            onClick={() => setActiveView(view)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all duration-150
                                ${isActive
                                    ? "bg-neon-green/8 border-r-2 border-neon-green text-neon-green"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/4"
                                }`}
                        >
                            <span className={isActive ? "text-neon-green" : "text-white/30"}>
                                {icon}
                            </span>
                            <span className="font-mono text-[10px] tracking-wide flex-1">{label}</span>
                            {badge !== null && (
                                <span className="min-w-[16px] h-4 px-1 rounded-full bg-alert-red flex items-center justify-center font-mono text-[8px] font-bold text-white">
                                    {badge}
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </nav>

            {/* Agents */}
            <div className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide">
                <div className="font-mono text-[8px] text-white/25 uppercase tracking-widest px-2 mb-2">
                    Agents
                </div>
                <div className="flex flex-col gap-0.5">
                    {SIDEBAR_AGENTS.map((id) => {
                        const agent = agents[id];
                        return (
                            <div key={id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-white/3 transition-colors">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOR[agent.status]}`} />
                                <span className="font-mono text-[10px] text-white/60 flex-1 truncate">
                                    {agent.icon} {agent.shortLabel}
                                </span>
                                <span className={`font-mono text-[7px] uppercase tracking-wider ${agent.status === "ACTIVE" ? "text-neon-green" :
                                        agent.status === "THINKING" ? "text-neon-blue" :
                                            agent.status === "ERROR" ? "text-alert-red" :
                                                agent.status === "SUCCESS" ? "text-neon-green/60" :
                                                    "text-white/20"
                                    }`}>
                                    {agent.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Cron Timer */}
            <div className="p-2 border-t border-white/5">
                <CronTimer />
            </div>
        </aside>
    );
};
