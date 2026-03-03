"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundGrid } from "@/components/layout/background-grid";
import { TerminalLogs } from "@/components/hud/terminal-logs";
import { ConstellationGraph } from "@/components/network/constellation-graph";
import { SignalInbox } from "@/components/radar/signal-inbox";
import { GlassModal } from "@/components/ui/glass-modal";
import { MissionInput } from "@/components/hud/mission-input";
import { CronTimer } from "@/components/hud/cron-timer";
import { SystemAlerts } from "@/components/ui/system-alert";
import { useAgentStore } from "@/store/agent-store";
import { Activity, Wifi, Cpu, Shield, AlertTriangle } from "lucide-react";

function SystemClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span>{time}</span>;
}

function WorkflowBadge() {
  const phase = useAgentStore((s) => s.workflowPhase);
  if (phase === "IDLE") return null;

  const colors: Record<string, string> = {
    DISPATCHING: "text-neon-blue bg-neon-blue/10 border-neon-blue/30",
    RUNNING: "text-neon-green bg-neon-green/10 border-neon-green/30 animate-pulse",
    AWAITING_APPROVAL: "text-cyber-amber bg-cyber-amber/10 border-cyber-amber/30 animate-pulse",
    PUBLISHING: "text-neon-blue bg-neon-blue/10 border-neon-blue/30 animate-pulse",
    DELIVERED: "text-neon-green bg-neon-green/10 border-neon-green/30",
    REVISING: "text-alert-red bg-alert-red/10 border-alert-red/30 animate-pulse",
  };

  return (
    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border tracking-wider ${colors[phase] || ""}`}>
      {phase.replace(/_/g, " ")}
    </span>
  );
}

// ── Fixed Top-Right Authorization Gate Widget ──
function AuthGateWidget({ onOpen }: { onOpen: () => void }) {
  const workflowPhase = useAgentStore((s) => s.workflowPhase);
  const isAwaiting = workflowPhase === "AWAITING_APPROVAL";
  const isDelivered = workflowPhase === "DELIVERED";
  const isRevising = workflowPhase === "REVISING";
  const isRunning = workflowPhase === "RUNNING" || workflowPhase === "DISPATCHING" || workflowPhase === "PUBLISHING";

  const statusCfg = isAwaiting ? { dotBg: "#ffb000", text: "AWAITING AUTH", textCls: "text-cyber-amber", borderColor: "rgba(255,176,0,0.5)", boxShadow: "0 0 20px rgba(255,176,0,0.25)" }
    : isDelivered ? { dotBg: "#39ff14", text: "DELIVERED", textCls: "text-neon-green", borderColor: "rgba(57,255,20,0.3)", boxShadow: "0 0 10px rgba(57,255,20,0.1)" }
      : isRevising ? { dotBg: "#ff2d55", text: "REVISING", textCls: "text-alert-red", borderColor: "rgba(255,45,85,0.3)", boxShadow: "none" }
        : isRunning ? { dotBg: "#00f0ff", text: "PROCESSING", textCls: "text-neon-blue", borderColor: "rgba(0,240,255,0.3)", boxShadow: "none" }
          : { dotBg: "rgba(255,255,255,0.3)", text: "STANDBY", textCls: "text-white/50", borderColor: "rgba(255,255,255,0.12)", boxShadow: "none" };

  return (
    <motion.div
      layout
      onClick={isAwaiting ? onOpen : undefined}
      className={`fixed top-[52px] right-4 z-50 flex flex-col gap-1.5 px-3 py-2.5 rounded
        bg-[#060a0f]/90 backdrop-blur-xl border transition-all duration-300
        ${isAwaiting ? "cursor-pointer hover:bg-cyber-amber/5" : "cursor-default"}`}
      style={{
        minWidth: 160,
        borderColor: statusCfg.borderColor,
        boxShadow: statusCfg.boxShadow,
      }}
      id="auth-gate-widget"
      aria-label="Authorization gate status"
    >
      {/* Corner brackets — always neon */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-neon-blue/40" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-neon-blue/40" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-neon-blue/15" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-neon-blue/15" />

      {/* Title — always visible */}
      <div className="flex items-center gap-2">
        <Shield size={10} className="text-neon-blue shrink-0" />
        <span className="font-mono text-[8px] font-bold tracking-[0.2em] uppercase text-neon-blue/80">
          Authorization Gate
        </span>
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-gradient-to-r from-neon-blue/20 via-white/10 to-transparent" />

      {/* Status row */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={isAwaiting || isRunning || isRevising ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className={`w-1.5 h-1.5 rounded-full shrink-0`}
          style={{ backgroundColor: statusCfg.dotBg }}
        />
        <span className={`font-mono text-[8px] font-bold tracking-[0.15em] uppercase ${statusCfg.textCls}`}
          style={isAwaiting ? { textShadow: "0 0 8px rgba(255,176,0,0.6)" } : {}}>
          {statusCfg.text}
        </span>
        {isAwaiting && (
          <AlertTriangle size={9} className="text-cyber-amber ml-auto animate-pulse" />
        )}
      </div>

      {isAwaiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-[7px] text-cyber-amber/60 tracking-wider"
        >
          ▸ Click to review
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Home() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const workflowPhase = useAgentStore((s) => s.workflowPhase);

  // Auto-open review modal when approval needed
  useEffect(() => {
    if (workflowPhase === "AWAITING_APPROVAL") {
      const timer = setTimeout(() => setReviewOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [workflowPhase]);

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-black">
      <BackgroundGrid />
      <SystemAlerts />
      {/* ── Fixed Top-Right Authorization Gate ── */}
      <AuthGateWidget onOpen={() => setReviewOpen(true)} />

      {/* ── Top Status Bar ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-2 border-b border-white/5 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.6)] animate-pulse" />
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase neon-text-blue animate-flicker">
              Cyber-Nexus
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/20">|</span>
          <span className="text-[9px] font-mono text-white/30">AI ORCHESTRA v2.0</span>
          <WorkflowBadge />
        </div>

        {/* Center placeholder — gate is fixed top-right */}
        <div />

        <div className="flex items-center gap-5 text-[9px] font-mono text-white/30">
          <div className="flex items-center gap-1.5"><Activity size={10} className="text-neon-green" /><span>9 AGENTS</span></div>
          <div className="flex items-center gap-1.5"><Wifi size={10} className="text-neon-blue" /><span>ONLINE</span></div>
          <div className="flex items-center gap-1.5"><Cpu size={10} className="text-cyber-amber" /><span>LANGGRAPH</span></div>
          <div className="flex items-center gap-1.5"><Shield size={10} className="text-neon-green" /><span>HITL ARMED</span></div>
          <span className="text-white/20">|</span>
          <span className="text-neon-blue font-bold tracking-wider"><SystemClock /></span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex items-stretch p-4 gap-4 min-h-0">
        {/* LEFT PANEL: Cron Timer + Terminal */}
        <section className="w-[340px] shrink-0 flex flex-col gap-3">
          <CronTimer />
          <div className="flex-1 min-h-0">
            <TerminalLogs />
          </div>
        </section>

        {/* CENTER: 3D Constellation */}
        <section className="flex-1 min-w-0 relative">
          <ConstellationGraph />
        </section>

        {/* RIGHT PANEL: Signal Inbox / HITL */}
        <section className="w-[300px] shrink-0">
          <SignalInbox onOpenReview={() => setReviewOpen(true)} />
        </section>
      </main>

      {/* ── Bottom: Mission Input + Status ── */}
      <footer className="relative z-20 px-4 pb-3 pt-0 flex flex-col gap-2 shrink-0">
        <MissionInput />
        <div className="flex items-center justify-between px-2 text-[8px] font-mono text-white/15 tracking-wider">
          <span>ENCRYPTION: AES-256-GCM • PROTOCOL: TLS 1.3 • BACKEND: localhost:3000</span>
          <span>NODE: EU-CENTRAL-1 • UPTIME: 99.97% • SESSION: ACTIVE</span>
        </div>
      </footer>

      {/* ── HITL Review Modal ── */}
      <GlassModal
        isOpen={reviewOpen && workflowPhase === "AWAITING_APPROVAL"}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
