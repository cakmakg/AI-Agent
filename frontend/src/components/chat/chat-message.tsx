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
                    <div className="font-mono text-[9px] text-white/45 text-right mb-1 tracking-wider">
                        SEN · {message.timestamp}
                    </div>
                    <div className="bg-neon-green/12 border border-neon-green/25 rounded-xl rounded-tr-sm px-4 py-3">
                        <p className="font-mono text-[12px] text-white/90 leading-relaxed">{message.content}</p>
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
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyber-amber/12 border border-cyber-amber/35">
                    <AlertTriangle size={11} className="text-cyber-amber shrink-0" />
                    <span className="font-mono text-[10px] text-cyber-amber font-semibold tracking-wide">{message.content}</span>
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/15">
                    <Info size={10} className="text-white/55 shrink-0" />
                    <span className="font-mono text-[10px] text-white/60 tracking-wide">{message.content}</span>
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
            <div className="shrink-0 w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center text-base bg-white/8 mt-0.5">
                {agent?.icon ?? "🤖"}
            </div>

            <div className="flex-1 min-w-0">
                <div className={`font-mono text-[9px] mb-1 tracking-wider font-semibold ${colorClass}`}>
                    {agent?.shortLabel ?? "SYSTEM"} · {message.timestamp}
                </div>
                <div className="bg-neon-blue/8 border border-neon-blue/18 rounded-xl rounded-tl-sm px-4 py-3">
                    <p className="font-mono text-[12px] text-white/85 leading-relaxed">{message.content}</p>
                </div>
            </div>
        </motion.div>
    );
};
