"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const SettingsView = () => {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // For Client Info (in a real app, Client would have its own PUT endpoint, but here we just show it or combine)
    const [client, setClient] = useState<any>(null);

    const [form, setForm] = useState({
        agentPersona: "",
        tone: "Kibar, profesyonel, güven verici",
        companyContext: "",
        supportInstructions: ""
    });

    useEffect(() => {
        setLoading(true);
        // Using "default" or fetching current tenant config
        fetch("/api/tenant/config") // In a real app we'd pass headers or auth session
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setConfig(data.config);
                    setClient(data.client);
                    if (data.config) {
                        setForm({
                            agentPersona: data.config.agentPersona || "",
                            tone: data.config.tone || "Kibar, profesyonel, güven verici",
                            companyContext: data.config.companyContext || "",
                            supportInstructions: data.config.supportInstructions || ""
                        });
                    }
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/tenant/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert("Ayarlar başarıyla kaydedildi!");
            }
        } catch (err) {
            console.error(err);
            alert("Kayıt sırasında hata oluştu!");
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-white/50 font-mono text-sm">Yükleniyor...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#090e1a] overflow-hidden">
            {/* Header */}
            <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h1 className="font-mono text-sm text-neon-blue font-bold tracking-wider mb-1">
                        CLIENT SETTINGS
                    </h1>
                    <p className="font-mono text-[10px] text-white/40">
                        {client ? `${client.name} (${client.slug})` : "Tenant Configuration"}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-neon-green/10 text-neon-green border border-neon-green/30 rounded font-mono text-[10px] hover:bg-neon-green hover:text-black transition-all disabled:opacity-50"
                >
                    {saving ? "KAYDEDİLİYOR..." : "KAYDET"}
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-3xl space-y-6">
                    {/* Persona */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded border border-white/5 bg-white/[0.02]">
                        <h2 className="font-mono text-xs text-white/80 mb-3">AI Ajan Personası (System Prompt)</h2>
                        <textarea
                            value={form.agentPersona}
                            onChange={(e) => setForm({ ...form, agentPersona: e.target.value })}
                            placeholder="Sen Agent Matrix şirketinin dijital asistanısın..."
                            className="w-full h-32 bg-[#090e1a] border border-white/10 rounded p-3 font-mono text-[11px] text-white/70 focus:border-neon-blue outline-none resize-none"
                        />
                    </motion.div>

                    {/* Tone */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded border border-white/5 bg-white/[0.02]">
                        <h2 className="font-mono text-xs text-white/80 mb-3">İletişim Tonu</h2>
                        <select
                            value={form.tone}
                            onChange={(e) => setForm({ ...form, tone: e.target.value })}
                            className="w-full bg-[#090e1a] border border-white/10 rounded px-3 py-2 font-mono text-[11px] text-white/70 focus:border-neon-blue outline-none"
                        >
                            <option value="Kibar, profesyonel, güven verici">Formal & Profesyonel</option>
                            <option value="Samimi, eğlenceli, enerjik">Samimi & Enerjik</option>
                            <option value="Teknik, detaylı, analitik">Teknik & Analitik</option>
                        </select>
                    </motion.div>

                    {/* Company Context */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded border border-white/5 bg-white/[0.02]">
                        <h2 className="font-mono text-xs text-white/80 mb-3">Şirket Hakkında Genel Bilgi</h2>
                        <textarea
                            value={form.companyContext}
                            onChange={(e) => setForm({ ...form, companyContext: e.target.value })}
                            placeholder="Örn: Merkez ofisimiz Kadıköy'de..."
                            className="w-full h-24 bg-[#090e1a] border border-white/10 rounded p-3 font-mono text-[11px] text-white/70 focus:border-neon-blue outline-none resize-none"
                        />
                    </motion.div>

                    {/* Support Instructions */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded border border-white/5 bg-white/[0.02]">
                        <h2 className="font-mono text-xs text-white/80 mb-3">Destek Şablonu Yönergeleri</h2>
                        <textarea
                            value={form.supportInstructions}
                            onChange={(e) => setForm({ ...form, supportInstructions: e.target.value })}
                            placeholder="Randevu için 0216 xxx'i yönlendir."
                            className="w-full h-24 bg-[#090e1a] border border-white/10 rounded p-3 font-mono text-[11px] text-white/70 focus:border-neon-blue outline-none resize-none"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
