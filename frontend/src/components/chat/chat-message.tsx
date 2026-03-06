"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import type { ChatMessage, AgentId } from "@/store/agent-store";
import { useAgentStore } from "@/store/agent-store";

const AGENT_COLORS: Record<AgentId, string> = {
    ceo:       "text-neon-blue",
    cto:       "text-neon-green",
    scraper:   "text-cyber-amber",
    analyst:   "text-neon-blue",
    writer:    "text-neon-green",
    qa:        "text-cyber-amber",
    hitl:      "text-alert-red",
    publisher: "text-neon-blue",
    radar:     "text-neon-green",
    cmo:       "text-[#ff6b35]",
    cfo:       "text-[#00d4aa]",
};

interface Props {
    message: ChatMessage;
}

export const ChatMessageBubble = ({ message }: Props) => {
    const { agents } = useAgentStore();

    if (message.role === "user") {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-end mb-3"
            >
                <div className="max-w-[78%]">
                    <div className="font-mono text-[8px] text-white/25 text-right mb-1 tracking-wider">
                        YOU · {message.timestamp}
                    </div>
                    <div className="bg-neon-green/8 border border-neon-green/15 rounded-lg rounded-tr-sm px-3.5 py-2.5">
                        <p className="font-mono text-[11px] text-white/85 leading-relaxed">{message.content}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (message.role === "alert") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center mb-3"
            >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-amber/8 border border-cyber-amber/20">
                    <AlertTriangle size={10} className="text-cyber-amber shrink-0" />
                    <span className="font-mono text-[9px] text-cyber-amber tracking-wide">{message.content}</span>
                </div>
            </motion.div>
        );
    }

    if (message.role === "system") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center mb-3"
            >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/4 border border-white/8">
                    <Info size={9} className="text-white/30 shrink-0" />
                    <span className="font-mono text-[9px] text-white/35 tracking-wide">{message.content}</span>
                </div>
            </motion.div>
        );
    }

    // agent role
    const agentId = message.agentId;
    const agent = agentId ? agents[agentId] : null;
    const colorClass = agentId ? (AGENT_COLORS[agentId] ?? "text-white/60") : "text-white/60";

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2.5 mb-3"
        >
            {/* Avatar */}
            <div className="shrink-0 w-7 h-7 rounded border border-white/10 flex items-center justify-center text-sm bg-white/3 mt-0.5">
                {agent?.icon ?? "🤖"}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`font-mono text-[8px] mb-1 tracking-wider ${colorClass}`}>
                    {agent?.shortLabel ?? "SYSTEM"} · {message.timestamp}
                </div>
                <div className="bg-neon-blue/4 border border-neon-blue/10 rounded-lg rounded-tl-sm px-3.5 py-2.5">
                    <p className="font-mono text-[11px] text-white/75 leading-relaxed">{message.content}</p>
                </div>
            </div>
        </motion.div>
    );
};
