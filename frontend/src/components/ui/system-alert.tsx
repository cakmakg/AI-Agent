"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { useAgentStore, SystemAlert } from "@/store/agent-store";

const ALERT_CONFIG: Record<SystemAlert["type"], { icon: React.ReactNode; borderColor: string; textColor: string; glowColor: string }> = {
    info: { icon: <Info size={14} />, borderColor: "border-neon-blue/40", textColor: "text-neon-blue", glowColor: "shadow-[0_0_20px_rgba(0,240,255,0.15)]" },
    success: { icon: <CheckCircle size={14} />, borderColor: "border-neon-green/40", textColor: "text-neon-green", glowColor: "shadow-[0_0_20px_rgba(57,255,20,0.15)]" },
    warning: { icon: <AlertTriangle size={14} />, borderColor: "border-cyber-amber/40", textColor: "text-cyber-amber", glowColor: "shadow-[0_0_20px_rgba(255,176,0,0.15)]" },
    error: { icon: <XCircle size={14} />, borderColor: "border-alert-red/40", textColor: "text-alert-red", glowColor: "shadow-[0_0_20px_rgba(255,45,85,0.15)]" },
};

export const SystemAlerts = () => {
    const alerts = useAgentStore((s) => s.alerts);

    return (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {alerts.map((alert) => {
                    const config = ALERT_CONFIG[alert.type];
                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className={`glass-panel border ${config.borderColor} ${config.glowColor} rounded-md px-5 py-2.5 flex items-center gap-3 pointer-events-auto`}
                        >
                            <span className={config.textColor}>{config.icon}</span>
                            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.15em] ${config.textColor}`}>
                                {alert.message}
                            </span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};
