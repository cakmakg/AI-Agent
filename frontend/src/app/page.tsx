"use client";

import { useState, useEffect } from "react";
import { BackgroundGrid } from "@/components/layout/background-grid";
import { TerminalLogs } from "@/components/hud/terminal-logs";
import { ConstellationGraph } from "@/components/network/constellation-graph";
import { SignalInbox, Signal } from "@/components/radar/signal-inbox";
import { GlassModal } from "@/components/ui/glass-modal";
import { Activity, Wifi, Cpu, Shield } from "lucide-react";

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

export default function Home() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const handleApprove = (id: string) => {
    console.log("HITL Approved:", id);
    setSelectedSignal(null);
  };

  const handleReject = (id: string) => {
    console.log("HITL Rejected:", id);
    setSelectedSignal(null);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden bg-black">
      <BackgroundGrid />

      {/* ── Top Status Bar (HUD) ── */}
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
        </div>

        <div className="flex items-center gap-5 text-[9px] font-mono text-white/30">
          <div className="flex items-center gap-1.5">
            <Activity size={10} className="text-neon-green" />
            <span>9 AGENTS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={10} className="text-neon-blue" />
            <span>ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-cyber-amber" />
            <span>LANGGRAPH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-neon-green" />
            <span>HITL ARMED</span>
          </div>
          <span className="text-[9px] font-mono text-white/20">|</span>
          <span className="text-neon-blue font-bold tracking-wider">
            <SystemClock />
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex items-stretch p-4 gap-4 min-h-0">
        {/* LEFT PANEL: HUD Terminal */}
        <section className="w-[340px] shrink-0">
          <TerminalLogs />
        </section>

        {/* CENTER PANEL: 3D Constellation */}
        <section className="flex-1 min-w-0 relative">
          <ConstellationGraph />
        </section>

        {/* RIGHT PANEL: Radar & Signal Inbox */}
        <section className="w-[300px] shrink-0">
          <SignalInbox onSelectSignal={setSelectedSignal} />
        </section>
      </main>

      {/* ── Bottom Status Bar ── */}
      <footer className="relative z-20 flex items-center justify-between px-6 py-1.5 border-t border-white/5 bg-black/30 backdrop-blur-sm shrink-0">
        <span className="text-[8px] font-mono text-white/15 tracking-wider">
          ENCRYPTION: AES-256-GCM • PROTOCOL: TLS 1.3 • LATENCY: 12ms
        </span>
        <span className="text-[8px] font-mono text-white/15 tracking-wider">
          NODE: EU-CENTRAL-1 • UPTIME: 99.97% • SESSION: ACTIVE
        </span>
      </footer>

      {/* ── HITL Approval Modal ── */}
      <GlassModal
        isOpen={!!selectedSignal}
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
