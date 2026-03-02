"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, Crosshair, Radio, Zap } from "lucide-react";

export interface Signal {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    urgency: "HIGH" | "NORMAL" | "CRITICAL";
}

interface Props {
    onSelectSignal: (signal: Signal) => void;
}

const SIGNAL_TITLES = [
    "BLUEPRINT READY FOR REVIEW",
    "AR-GE INNOVATION REPORT",
    "CONTENT DRAFT AWAITING QA",
    "MARKET ANALYSIS COMPLETE",
    "WEBHOOK DELIVERY PENDING",
    "SCRAPER DATA EXTRACTION DONE",
    "CTO ARCHITECTURE PROPOSAL",
    "SECURITY AUDIT FLAGGED",
];

const SIGNAL_SOURCES = ["REACTIVE_ENGINE", "PROACTIVE_CRON", "CTO_NODE", "QA_GATE", "RADAR_SCAN", "CEO_DISPATCH"];

export const SignalInbox = ({ onSelectSignal }: Props) => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [sweepAngle, setSweepAngle] = useState(0);
    const [lastPingTime, setLastPingTime] = useState<number | null>(null);

    // Radar sweep animation
    useEffect(() => {
        const interval = setInterval(() => {
            setSweepAngle((prev) => (prev + 3) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Signal generator
    useEffect(() => {
        const interval = setInterval(() => {
            const urgencies: Signal["urgency"][] = ["NORMAL", "NORMAL", "HIGH", "NORMAL", "CRITICAL"];
            const newSignal: Signal = {
                id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2),
                title: SIGNAL_TITLES[Math.floor(Math.random() * SIGNAL_TITLES.length)],
                source: SIGNAL_SOURCES[Math.floor(Math.random() * SIGNAL_SOURCES.length)],
                timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
                status: "PENDING",
                urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
            };
            setSignals((prev) => [newSignal, ...prev].slice(0, 12));
            setLastPingTime(Date.now());
        }, 12000);
        return () => clearInterval(interval);
    }, []);

    const isPinging = lastPingTime !== null && Date.now() - lastPingTime < 2000;

    const getUrgencyStyle = useCallback((urgency: Signal["urgency"]) => {
        switch (urgency) {
            case "CRITICAL": return "border-alert-red/40 bg-alert-red/5 shadow-[0_0_15px_rgba(255,45,85,0.1)]";
            case "HIGH": return "border-cyber-amber/30 bg-cyber-amber/5";
            default: return "border-white/8 bg-white/[0.02]";
        }
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-3">
            {/* ── Radar Display ── */}
            <div className="glass-panel w-full h-[200px] rounded-md border border-neon-green/15 flex flex-col relative overflow-hidden shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 z-10 shrink-0">
                    <div className="flex items-center gap-2">
                        <Radio size={12} className="text-neon-green" />
                        <span className="neon-text-green font-mono text-[10px] uppercase tracking-[0.2em]">Signal Radar</span>
                    </div>
                    <AnimatePresence>
                        {isPinging && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[9px] font-mono text-neon-green animate-pulse flex items-center gap-1"
                            >
                                <Zap size={9} /> CONTACT
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Radar Circle */}
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Concentric rings */}
                    <div className="absolute w-28 h-28 rounded-full border border-neon-green/10" />
                    <div className="absolute w-20 h-20 rounded-full border border-neon-green/8" />
                    <div className="absolute w-12 h-12 rounded-full border border-neon-green/6" />

                    {/* Crosshair */}
                    <div className="absolute w-28 h-[1px] bg-neon-green/10" />
                    <div className="absolute h-28 w-[1px] bg-neon-green/10" />

                    {/* Sweep line */}
                    <div
                        className="absolute w-14 h-[1px] origin-left"
                        style={{
                            transform: `rotate(${sweepAngle}deg)`,
                            background: "linear-gradient(to right, rgba(57,255,20,0.5), transparent)",
                        }}
                    />

                    {/* Sweep trail (conic gradient) */}
                    <div
                        className="absolute w-28 h-28 rounded-full"
                        style={{
                            background: `conic-gradient(from ${sweepAngle}deg, transparent 0deg, rgba(57,255,20,0.08) 30deg, transparent 60deg)`,
                        }}
                    />

                    {/* Center dot */}
                    <div className="absolute w-2 h-2 rounded-full bg-neon-green/80 shadow-[0_0_8px_rgba(57,255,20,0.6)]" />

                    {/* Signal blips */}
                    {signals.slice(0, 4).map((signal, i) => {
                        const angle = (i * 90 + 45) * (Math.PI / 180);
                        const r = 30 + (i * 10);
                        return (
                            <motion.div
                                key={signal.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`absolute w-1.5 h-1.5 rounded-full ${signal.urgency === 'CRITICAL' ? 'bg-alert-red animate-pulse' : signal.urgency === 'HIGH' ? 'bg-cyber-amber animate-pulse' : 'bg-neon-green/60'}`}
                                style={{
                                    left: `calc(50% + ${Math.cos(angle) * r}px)`,
                                    top: `calc(50% + ${Math.sin(angle) * r}px)`,
                                    boxShadow: signal.urgency === 'CRITICAL' ? '0 0 8px rgba(255,45,85,0.6)' : '0 0 4px rgba(57,255,20,0.4)',
                                }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* ── Inbox List ── */}
            <div className="glass-panel w-full flex-1 border border-cyber-amber/15 rounded-md flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Crosshair size={12} className="text-cyber-amber" />
                        <span className="neon-text-amber font-mono text-[10px] uppercase tracking-[0.2em]">Pending Signals</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30 font-bold">
                        {signals.filter((s) => s.status === "PENDING").length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide p-2 flex flex-col gap-1.5">
                    <AnimatePresence>
                        {signals.map((signal) => (
                            <motion.div
                                key={signal.id}
                                initial={{ opacity: 0, x: 20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: "auto" }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                onClick={() => onSelectSignal(signal)}
                                className={`p-2.5 rounded border cursor-pointer transition-all duration-200 group
                  hover:bg-white/[0.04] hover:border-cyber-amber/30 hover:shadow-[0_0_12px_rgba(255,176,0,0.08)]
                  ${getUrgencyStyle(signal.urgency)}`}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[8px] font-mono text-white/30">{signal.timestamp}</span>
                                    <div className="flex items-center gap-1.5">
                                        {signal.urgency === "CRITICAL" && <ShieldAlert size={10} className="text-alert-red" />}
                                        {signal.urgency === "HIGH" && <Bell size={10} className="text-cyber-amber" />}
                                        <span className={`text-[8px] font-mono font-bold px-1 rounded
                      ${signal.urgency === "CRITICAL" ? "text-alert-red bg-alert-red/10" : signal.urgency === "HIGH" ? "text-cyber-amber bg-cyber-amber/10" : "text-white/40"}`}>
                                            {signal.urgency}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="text-[10px] font-mono font-medium text-white/80 group-hover:text-cyber-amber transition-colors leading-tight">
                                    {signal.title}
                                </h3>
                                <div className="flex justify-between items-center mt-2 text-[8px] font-mono text-white/25">
                                    <span>SRC: {signal.source}</span>
                                    <span className="text-cyber-amber/60">{signal.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {signals.length === 0 && (
                        <div className="flex flex-col items-center justify-center flex-1 text-white/15 font-mono text-[10px] gap-2">
                            <Crosshair size={20} className="animate-pulse" />
                            <span>No pending signals</span>
                            <span className="text-[8px]">System monitoring active</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
