"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export type Signal = {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    urgency: "HIGH" | "NORMAL";
};

type Props = {
    onSelectSignal: (signal: Signal) => void;
};

export const SignalInbox = ({ onSelectSignal }: Props) => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [ping, setPing] = useState(false);

    // Sahte sinyalleri periyodik olarak üret
    useEffect(() => {
        const interval = setInterval(() => {
            setPing(true);
            setTimeout(() => setPing(false), 1000);

            const newSignal: Signal = {
                id: Math.random().toString(36).substring(7),
                title: ["YENİ İŞ AKIŞI TALEBİ", "AR-GE RADAR RAPORU", "ANALİZ SONUCU ONAY BEKLİYOR", "İÇERİK TASLAĞI HAZIR"][Math.floor(Math.random() * 4)],
                source: ["API GATEWAY", "PROACTIVE CRON", "CTO NODE", "QA NODE"][Math.floor(Math.random() * 4)],
                timestamp: new Date().toLocaleTimeString("tr-TR", { hour12: false }),
                status: "PENDING",
                urgency: Math.random() > 0.7 ? "HIGH" : "NORMAL",
            };

            setSignals((prev) => [newSignal, ...prev].slice(0, 10)); // Son 10 sinyal
        }, 15000); // Her 15 saniyede bir yeni sinyal

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {/* Radar Mini Panel */}
            <div className="glass-panel w-full h-[180px] rounded-md border border-white/10 flex flex-col p-4 relative overflow-hidden shrink-0">
                <h2 className="neon-text-green font-mono text-sm uppercase tracking-widest flex items-center justify-between z-10">
                    <span>Ar-Ge Radarı</span>
                    {ping && <span className="text-neon-green text-[10px] animate-pulse">PING RECEIVED</span>}
                </h2>

                {/* Radar Animation */}
                <div className="absolute inset-0 flex items-center justify-center mt-6">
                    <div className="w-24 h-24 rounded-full border border-neon-green/30 relative">
                        <div className="absolute inset-0 rounded-full border border-neon-green/10 scale-150 animate-ping" />
                        <div className="w-full h-full rounded-full border-t border-neon-green animate-spin" style={{ animationDuration: '3s' }} />
                        {ping && <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-neon-green animate-pulse" />}
                    </div>
                </div>
            </div>

            {/* Inbox Panel */}
            <div className="glass-panel w-full flex-1 border border-white/10 rounded-md p-4 flex flex-col overflow-hidden">
                <h2 className="neon-text-amber font-mono text-sm uppercase mb-4 tracking-widest border-b border-white/10 pb-2 flex items-center justify-between shrink-0">
                    <span>Yargıç Onay Bekleyenler</span>
                    <span className="text-[10px] bg-cyber-amber text-black px-1.5 py-0.5 rounded-sm font-bold">
                        {signals.filter(s => s.status === 'PENDING').length}
                    </span>
                </h2>

                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2 pr-1 pb-4">
                    <AnimatePresence>
                        {signals.map((signal) => (
                            <motion.div
                                key={signal.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => onSelectSignal(signal)}
                                className={`p-3 rounded-md border ${signal.urgency === 'HIGH' ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'} cursor-pointer hover:bg-white/10 transition-colors group shrink-0`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-mono opacity-50 flex items-center gap-1">
                                        <Clock size={10} /> {signal.timestamp}
                                    </span>
                                    {signal.urgency === 'HIGH' && <ShieldAlert size={12} className="text-red-500" />}
                                </div>
                                <h3 className="text-xs font-mono font-medium leading-tight group-hover:text-neon-amber transition-colors text-white/90">
                                    {signal.title}
                                </h3>
                                <div className="mt-3 text-[10px] font-mono uppercase opacity-60 flex justify-between items-center">
                                    <span>SRC: {signal.source}</span>
                                    <span className="text-cyber-amber flex items-center gap-1">
                                        <Bell size={10} /> {signal.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))}

                        {signals.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full opacity-30 font-mono text-xs text-center mt-10"
                            >
                                <CheckCircle size={24} className="mb-2" />
                                <span>Bekleyen işlem yok.<br />Sistem stabil.</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
