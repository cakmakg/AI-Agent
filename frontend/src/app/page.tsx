"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BackgroundGrid } from "@/components/layout/background-grid";
import { TerminalLogs } from "@/components/hud/terminal-logs";
import { ConstellationGraph } from "@/components/network/constellation-graph";
import { SignalInbox } from "@/components/radar/signal-inbox";
import { ArtifactViewer } from "@/components/ui/artifact-viewer";
import { ArtifactsPanel } from "@/components/hud/artifacts-panel";
import { MissionInput } from "@/components/hud/mission-input";
import { CronTimer } from "@/components/hud/cron-timer";
import { SystemAlerts } from "@/components/ui/system-alert";
import { useAgentStore } from "@/store/agent-store";
import { Activity, Wifi, Cpu, Shield, AlertTriangle, Download, Loader2 } from "lucide-react";

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
function AuthGateWidget() {
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
      className={`fixed top-[52px] right-4 z-50 flex flex-col gap-1.5 px-3 py-2.5 rounded
        bg-[#060a0f]/90 backdrop-blur-xl border transition-all duration-300 cursor-default`}
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

function PullIntelButton() {
  const [isPulling, setIsPulling] = useState(false);
  const { pullLatestArtifact, workflowPhase } = useAgentStore();
  const active = workflowPhase !== "IDLE";

  const handlePull = async () => {
    setIsPulling(true);
    await pullLatestArtifact();
    setIsPulling(false);
  };

  return (
    <motion.button
      whileHover={active ? { scale: 1.04 } : {}}
      whileTap={active ? { scale: 0.96 } : {}}
      onClick={active ? handlePull : undefined}
      disabled={isPulling}
      className="flex items-center gap-2 px-4 py-1.5 rounded font-mono text-[9px] font-bold uppercase tracking-[0.18em] transition-all disabled:cursor-wait"
      style={{
        border: active ? "1px solid rgba(0,240,255,0.4)" : "1px solid rgba(255,255,255,0.07)",
        background: active ? "rgba(0,240,255,0.06)" : "rgba(255,255,255,0.03)",
        color: active ? "#00f0ff" : "rgba(255,255,255,0.2)",
        boxShadow: active ? "0 0 12px rgba(0,240,255,0.08)" : "none",
        cursor: active ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (!active) return;
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,240,255,0.13)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,240,255,0.22)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? "rgba(0,240,255,0.06)" : "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = active ? "0 0 12px rgba(0,240,255,0.08)" : "none";
      }}
    >
      {isPulling ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
      {isPulling ? "PULLING..." : "PULL LATEST INTEL"}
    </motion.button>
  );
}

export default function Home() {
  const ctoStatus = useAgentStore((s) => s.agents.cto.status);
  const ctoActive = ctoStatus === "ACTIVE" || ctoStatus === "THINKING";

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden" style={{ background: "#090e1a" }}>
      <BackgroundGrid />
      <SystemAlerts />
      {/* ── Fixed Top-Right Authorization Gate ── */}
      <AuthGateWidget />

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

        {/* Center: PULL LATEST INTEL */}
        <PullIntelButton />

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

        {/* CENTER: 3D Constellation + overlays */}
        <section className="flex-1 min-w-0 relative">
          <ConstellationGraph />
          {/* CTO Blueprint — CTO aktifken constellation üzerinde görünür (z-15) */}
          {ctoActive && (
            <div className="absolute inset-0 z-[15]">
              <ArtifactsPanel />
            </div>
          )}
          {/* Artifact Review — AWAITING_APPROVAL fazında en üstte (z-20) */}
          <ArtifactViewer />
        </section>

        {/* RIGHT PANEL: Signal Inbox / HITL */}
        <section className="w-[300px] shrink-0">
          <SignalInbox onOpenReview={() => { }} />
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
    </div>
  );
}
