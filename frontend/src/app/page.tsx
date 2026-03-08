"use client";

import { useAgentStore } from "@/store/agent-store";
import { SystemAlerts } from "@/components/ui/system-alert";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatView } from "@/components/chat/chat-view";
import { InboxView } from "@/components/inbox/inbox-view";
import { CfoDashboard } from "@/components/finance/cfo-dashboard";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";
import { AgentTopology } from "@/components/agents/agent-topology";
import { SettingsView } from "@/components/settings/settings-view";
import { SkillsView } from "@/components/skills/skills-view";
import { RightPanel } from "@/components/context/right-panel";
import { ApiKeyModal } from "@/components/auth/api-key-modal";

export default function Home() {
    const activeView = useAgentStore((s) => s.activeView);

    return (
        <div
            className="w-screen h-screen flex overflow-hidden"
            style={{ background: "#111827" }}
        >
            <ApiKeyModal />
            <SystemAlerts />

            {/* ── LEFT SIDEBAR ── */}
            <Sidebar />

            {/* ── CENTER STAGE ── */}
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden border-x border-white/5">
                {activeView === "chat" && <ChatView />}
                {activeView === "inbox" && <InboxView />}
                {activeView === "cfo" && <CfoDashboard />}
                {activeView === "knowledge" && <KnowledgeView />}
                {activeView === "topology" && <AgentTopology />}
                {activeView === "settings" && <SettingsView />}
                {activeView === "skills" && <SkillsView />}
            </main>

            {/* ── RIGHT PANEL ── */}
            <RightPanel />
        </div>
    );
}
