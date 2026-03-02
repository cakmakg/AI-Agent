"use client";

import { useState } from "react";
import { BackgroundGrid } from "@/components/layout/background-grid";
import { TerminalLogs } from "@/components/hud/terminal-logs";
import { ConstellationGraph } from "@/components/network/constellation-graph";
import { SignalInbox, Signal } from "@/components/radar/signal-inbox";
import { GlassModal } from "@/components/ui/glass-modal";

export default function Home() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const handleApprove = (id: string) => {
    // Burada ileride Backend'e onay isteği (isApproved: true) atılacak
    console.log("HITL Approved:", id);
    setSelectedSignal(null);
  };

  const handleReject = (id: string) => {
    // Burada ileride Backend'e ret/yeniden yazım isteği atılacak
    console.log("HITL Rejected:", id);
    setSelectedSignal(null);
  };

  return (
    <main className="relative w-screen h-screen flex items-center justify-between p-6 overflow-hidden">
      <BackgroundGrid />

      {/* LEFT PANEL: HUD Terminal */}
      <section className="w-[300px] h-[calc(100vh-3rem)] flex flex-col gap-4 z-10 shrink-0">
        <TerminalLogs />
      </section>

      {/* CENTER PANEL: Constellation 3D Graph */}
      <section className="flex-1 h-full flex items-center justify-center relative z-0">
        <ConstellationGraph />
      </section>

      {/* RIGHT PANEL: Radar & Inbox */}
      <section className="w-[320px] h-[calc(100vh-3rem)] flex flex-col gap-4 z-10 shrink-0">
        <SignalInbox onSelectSignal={setSelectedSignal} />
      </section>

      {/* HITL MODAL */}
      <GlassModal
        isOpen={!!selectedSignal}
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </main>
  );
}
