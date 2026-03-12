"use client";

import React, { useState, useEffect } from "react";
import { useAgentStore } from "@/store/agent-store";
import { KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ApiKeyModal = () => {
    const { apiKey, setApiKey } = useAgentStore();
    const [inputValue, setInputValue] = useState("");

    // Yalnızca SSR uyumsuzluğunu önlemek için client tarafına monte edilince kontrol ediyoruz
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // API Key var ise modal'ı gösterme
    if (!mounted || apiKey) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setApiKey(inputValue.trim());
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090e1a]/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md p-6 bg-[#090e1a] border border-neon-blue/20 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.1)]"
                >
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-neon-blue/10 rounded-full flex items-center justify-center text-neon-blue">
                            <KeyRound size={24} />
                        </div>
                    </div>

                    <h2 className="text-center font-mono text-lg text-white mb-2 tracking-wider">
                        TENANT AUTHENTICATION
                    </h2>

                    <p className="text-center font-mono text-xs text-white/50 mb-6">
                        Welcome to AI Orchestra. Please provide your multi-tenant Client API Key to connect to your isolated workspace.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <input
                                type="password"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="sk-client-name-xxxxxxxx..."
                                className="w-full bg-[#090e1a] border border-white/20 rounded p-3 text-center font-mono text-sm text-neon-green placeholder:text-white/20 focus:border-neon-blue focus:outline-none transition-colors"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!inputValue.trim()}
                            className="w-full py-3 bg-neon-blue text-[#090e1a] font-mono font-bold text-sm tracking-wider rounded hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-neon-blue"
                        >
                            CONNECT TO WORKSPACE
                        </button>

                        <button
                            type="button"
                            onClick={() => { if (typeof window !== "undefined") { localStorage.removeItem("ai_orchestra_api_key"); } setApiKey("default"); }}
                            className="w-full py-2 font-mono text-[11px] text-white/40 hover:text-white/70 transition-colors tracking-wider"
                        >
                            Skip — Use Default Tenant
                        </button>
                    </form>

                    <p className="text-center font-mono text-[10px] text-white/30 mt-4 leading-relaxed">
                        Multi-tenant key yoksa "Skip — Use Default Tenant" ile devam edebilirsin.
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
