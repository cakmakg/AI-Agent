"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Crosshair, Radio, Zap } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";
import { MissionHistory } from "@/components/radar/mission-history";

// ── Types ──
export interface Signal {
    id: string;
    title: string;
    source: string;
    timestamp: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    urgency: "HIGH" | "NORMAL" | "CRITICAL";
}

interface Props {
    onOpenReview: () => void;
}

// ── Urgency Config ──
const URGENCY_CONFIG = {
    CRITICAL: { color: "#ff2d55", glow: "rgba(255,45,85,0.7)", textCls: "text-alert-red", borderCls: "border-alert-red/40", bgCls: "bg-alert-red/10" },
    HIGH: { color: "#ffb000", glow: "rgba(255,176,0,0.6)", textCls: "text-cyber-amber", borderCls: "border-cyber-amber/40", bgCls: "bg-cyber-amber/10" },
    NORMAL: { color: "#39ff14", glow: "rgba(57,255,20,0.6)", textCls: "text-neon-green", borderCls: "border-neon-green/30", bgCls: "bg-neon-green/5" },
};

// ── Conic Radar Canvas ──
const RadarCanvas = ({ signals, isAwaiting }: { signals: Signal[]; isAwaiting: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const angleRef = useRef(0);
    const rafRef = useRef<number | null>(null);
    const blipPositions = useRef<{ x: number; y: number; signal: Signal }[]>([]);

    useEffect(() => {
        blipPositions.current = signals.map((sig, i) => {
            const angle = (i / Math.max(signals.length, 1)) * Math.PI * 2;
            const r = 0.3 + (i % 3) * 0.2;
            return { x: 0.5 + Math.cos(angle) * r * 0.45, y: 0.5 + Math.sin(angle) * r * 0.45, signal: sig };
        });
        if (isAwaiting) {
            blipPositions.current.push({ x: 0.62, y: 0.28, signal: { id: "hitl", title: "HITL GATE", source: "SYSTEM", timestamp: "", status: "PENDING", urgency: "CRITICAL" } });
        }
    }, [signals, isAwaiting]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const draw = () => {
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;
            const R = Math.min(W, H) / 2 - 6;
            ctx.clearRect(0, 0, W, H);

            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

            [R, R * 0.67, R * 0.35].forEach((r) => {
                ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(57,255,20,0.12)"; ctx.lineWidth = 1; ctx.stroke();
            });

            ctx.strokeStyle = "rgba(57,255,20,0.10)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

            angleRef.current += 0.018;
            const sweepStart = angleRef.current;
            const sweepSpan = Math.PI * 0.55;
            for (let a = 0; a < sweepSpan; a += 0.01) {
                const alpha = (1 - a / sweepSpan) * 0.35;
                ctx.beginPath(); ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, R, sweepStart - a, sweepStart - a + 0.012);
                ctx.closePath(); ctx.fillStyle = `rgba(57,255,20,${alpha})`; ctx.fill();
            }

            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(sweepStart) * R, cy + Math.sin(sweepStart) * R);
            ctx.strokeStyle = "rgba(57,255,20,0.7)"; ctx.lineWidth = 1.5; ctx.stroke();

            const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
            cGrad.addColorStop(0, "rgba(57,255,20,0.9)"); cGrad.addColorStop(1, "rgba(57,255,20,0)");
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = cGrad; ctx.fill();

            blipPositions.current.forEach(({ x, y, signal }) => {
                const bx = x * W, by = y * H;
                const { color, glow } = URGENCY_CONFIG[signal.urgency];
                const blipAngle = Math.atan2(by - cy, bx - cx);
                const deltaAngle = ((sweepStart - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                const fadeAlpha = deltaAngle < 0.8 ? 1 : Math.max(0.3, 1 - (deltaAngle - 0.8) * 0.5);

                const grad = ctx.createRadialGradient(bx, by, 0, bx, by, 10);
                grad.addColorStop(0, glow.replace("0.7", String(0.7 * fadeAlpha)));
                grad.addColorStop(1, "rgba(0,0,0,0)");
                ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();

                ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.globalAlpha = fadeAlpha; ctx.fill(); ctx.globalAlpha = 1;

                if (signal.urgency === "CRITICAL") {
                    const pulseR = 6 + ((Date.now() % 1500) / 1500) * 10;
                    const pulseAlpha = 0.5 - ((Date.now() % 1500) / 1500) * 0.5;
                    ctx.beginPath(); ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,45,85,${pulseAlpha * fadeAlpha})`; ctx.lineWidth = 1; ctx.stroke();
                }
            });

            ctx.globalCompositeOperation = "destination-in";
            ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = "black"; ctx.fill();
            ctx.globalCompositeOperation = "source-over";

            rafRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={220} height={220}
            className="w-full h-full"
            style={{ maxWidth: 220, maxHeight: 220 }}
            aria-label="Signal radar display"
        />
    );
};

// ── Signal Card ──
const SignalCard = ({ signal, onOpenReview }: { signal: Signal; onOpenReview: () => void }) => {
    const cfg = URGENCY_CONFIG[signal.urgency];
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.01 }}
            onClick={onOpenReview}
            className={`cursor-pointer rounded border ${cfg.borderCls} ${cfg.bgCls} p-2.5 flex flex-col gap-1`}
        >
            <div className="flex items-center justify-between">
                <span className={`font-mono text-[9px] font-bold uppercase tracking-[0.15em] ${cfg.textCls}`} style={{ textShadow: `0 0 6px ${cfg.color}` }}>
                    {signal.title}
                </span>
                <span className={`font-mono text-[7px] px-1.5 py-[1px] rounded border ${cfg.borderCls} ${cfg.textCls} tracking-wider`}>
                    {signal.urgency}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-white/30">{signal.source}</span>
                <span className="font-mono text-[7px] text-white/20">{signal.timestamp}</span>
            </div>
        </motion.div>
    );
};

// ── Main Component ──
export const SignalInbox = ({ onOpenReview }: Props) => {
    const { workflowPhase, missionMessage } = useAgentStore();
    const isAwaiting = workflowPhase === "AWAITING_APPROVAL";
    const isDelivered = workflowPhase === "DELIVERED";
    const isRunning = workflowPhase === "RUNNING" || workflowPhase === "DISPATCHING";

    const signals: Signal[] = [];
    if (isAwaiting) signals.push({ id: "hitl-pending", title: "HITL AUTHORIZATION", source: "AI ORCHESTRA", timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }), status: "PENDING", urgency: "CRITICAL" });
    if (isRunning) signals.push({ id: "workflow-active", title: "WORKFLOW ACTIVE", source: "LANGGRAPH", timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }), status: "PENDING", urgency: "HIGH" });
    if (isDelivered) signals.push({ id: "delivered", title: "PAYLOAD DELIVERED", source: "PUBLISHER", timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }), status: "APPROVED", urgency: "NORMAL" });

    return (
        <div className="w-full h-full flex flex-col gap-3">

            {/* ── TOP: HITL Authorization Gate ── */}
            <div className={`glass-panel w-full rounded-md border flex flex-col relative overflow-hidden shrink-0 transition-all duration-500
                ${isAwaiting ? "border-cyber-amber/40 shadow-[0_0_25px_rgba(255,176,0,0.12)]" : "border-white/8"}`}
            >
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Crosshair size={12}
                            className={isAwaiting ? "text-cyber-amber animate-spin" : "text-white/25"}
                            style={isAwaiting ? { animationDuration: "3s" } : {}}
                        />
                        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${isAwaiting ? "neon-text-amber" : "text-white/25"}`}>
                            {isAwaiting ? "Authorization Gate" : "Pending Signals"}
                        </span>
                    </div>
                    <AnimatePresence>
                        {signals.length > 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                className="font-mono text-[8px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded"
                            >
                                {signals.length}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-3 flex flex-col gap-2">
                    <AnimatePresence mode="wait">
                        {isAwaiting ? (
                            <motion.div key="awaiting" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col gap-2">
                                {missionMessage && (
                                    <p className="font-mono text-[9px] text-cyber-amber/70 truncate">↳ {missionMessage.slice(0, 55)}...</p>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    onClick={onOpenReview}
                                    className="w-full py-2.5 rounded font-mono text-[10px] font-bold uppercase tracking-[0.15em]
                                        bg-cyber-amber/15 border border-cyber-amber/50 text-cyber-amber
                                        hover:bg-cyber-amber/25 hover:shadow-[0_0_20px_rgba(255,176,0,0.25)]
                                        transition-all flex items-center justify-center gap-2"
                                    id="open-review-btn"
                                    aria-label="Open review panel"
                                >
                                    <ShieldAlert size={14} /> Review &amp; Authorize
                                </motion.button>
                            </motion.div>
                        ) : signals.length > 0 ? (
                            <AnimatePresence>
                                {signals.map((sig) => (
                                    <SignalCard key={sig.id} signal={sig} onOpenReview={onOpenReview} />
                                ))}
                            </AnimatePresence>
                        ) : (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="flex flex-col items-center py-4 gap-2 text-white/15"
                            >
                                <Crosshair size={16} className="opacity-20" />
                                <span className="font-mono text-[9px]">No pending signals</span>
                                <span className="font-mono text-[7px] text-white/10">System monitoring active</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── MIDDLE: Mission Archive Toggle ── */}
            <MissionHistory />

            {/* ── BOTTOM: Conic Radar Display ── */}
            <div className="glass-panel w-full flex-1 rounded-md border border-neon-green/15 flex flex-col relative overflow-hidden min-h-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <Radio size={12} className="text-neon-green" />
                        <span className="neon-text-green font-mono text-[10px] uppercase tracking-[0.2em]">Signal Radar</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
                        <span className="font-mono text-[8px] text-neon-green/50">ACTIVE SCAN</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-3 min-h-0">
                    <RadarCanvas signals={signals} isAwaiting={isAwaiting} />
                </div>

                <div className="px-4 py-1.5 border-t border-white/5 shrink-0 flex items-center justify-between">
                    <span className="font-mono text-[8px] text-white/20">
                        SIGNALS: <span className={signals.length > 0 ? "text-neon-green" : "text-white/30"}>{signals.length}</span>
                    </span>
                    <span className="font-mono text-[8px] text-white/20 flex items-center gap-1">
                        <Zap size={8} className="text-neon-green/40" /> SWEEP: 360°
                    </span>
                </div>
            </div>

        </div>
    );
};
