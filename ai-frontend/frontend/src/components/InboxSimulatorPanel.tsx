import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, AlertTriangle, Flame, ShieldAlert, CheckCircle } from 'lucide-react';
import { simulateInbox } from '../services/api';

export default function InboxSimulatorPanel() {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleRun = async () => {
        if (!message.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const res = await simulateInbox(message);
            setResult(res);
        } catch (e) {
            console.error(e);
            setResult({ status: 'ERROR', reason: 'Verbindung zum Server fehlgeschlagen. Läuft das Backend (Express)?' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel flex flex-col h-full relative"
        >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20 shadow-[0_0_10px_rgba(191,0,255,0.3)]">
                        <Mail className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Posteingang-Simulator</h2>
                        <p className="text-xs text-gray-400">Agent 6 Testumgebung</p>
                    </div>
                </div>
                <span className="text-xs font-mono bg-secondary/20 text-secondary px-3 py-1 rounded-full border border-secondary/30 shadow-neon-purple">
                    AGENT_6_ONLINE
                </span>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-300">Eingehende E-Mail / Nachricht</label>
                    <textarea
                        className="glass-input h-32 resize-none focus:ring-secondary/50 focus:border-secondary/50 focus:shadow-[0_0_15px_rgba(191,0,255,0.2)]"
                        placeholder="Geben Sie hier eine simulierte Kundennachricht ein (versuchen Sie, 'rabatt' für Spam hinzuzufügen, oder schreiben Sie eine lange Unternehmensnachricht für einen heißen Lead)..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleRun}
                    disabled={isLoading || !message.trim()}
                    className="btn-cyber btn-cyber-secondary flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed py-4 mt-auto"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Mail className="w-5 h-5 group-hover:scale-110 transition-transform fill-current opacity-70" />
                    )}
                    <span className="font-bold tracking-widest text-sm">
                        {isLoading ? "POSTEINGANG WIRD VERARBEITET..." : "POSTEINGANG SIMULIEREN (AUSLÖSEN)"}
                    </span>
                </button>

                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col items-center justify-center py-10 rounded-xl bg-gradient-to-b from-secondary/5 to-transparent border border-dashed border-secondary/20"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 border-t-2 border-secondary rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-r-2 border-primary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                                <Mail className="w-10 h-10 text-secondary p-2 animate-pulse" />
                            </div>
                            <p className="text-secondary font-medium animate-pulse neon-text-purple text-center tracking-wide text-sm">
                                Agent 6 filtert und analysiert...
                            </p>
                        </motion.div>
                    )}

                    {result && !isLoading && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4"
                        >
                            {result.status === 'IGNORED' ? (
                                <div className="bg-danger/10 border border-danger/30 rounded-xl p-5 shadow-[0_0_15px_rgba(255,51,102,0.15)] flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="w-6 h-6 text-danger animate-pulse" />
                                        <h3 className="text-base font-bold text-danger tracking-wide shadow-danger">SPAM Gefiltert - Orchestrator nicht belastet</h3>
                                    </div>
                                    <p className="text-sm text-danger/90 bg-black/40 p-3 rounded-lg border border-danger/20 font-medium">
                                        {result.reason}
                                    </p>
                                </div>
                            ) : result.status === 'HOT_LEAD_PROCESSED' ? (
                                <div className="bg-success/10 border border-success/30 rounded-xl p-5 shadow-[0_0_20px_rgba(0,255,170,0.15)] flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <Flame className="w-6 h-6 text-success animate-bounce" />
                                        <h3 className="text-base font-bold text-success tracking-wide" style={{ textShadow: '0 0 10px rgba(0,255,170,0.8)' }}>
                                            🔥 HEISSER LEAD BESTÄTIGT!
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="bg-success/5 border border-success/20 p-3 rounded-lg">
                                            <div className="text-xs text-success/70 uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" /> Automatisch Generierte Aufgabe
                                            </div>
                                            <p className="text-sm font-medium text-success/90">{result.generatedTask}</p>
                                        </div>

                                        <div className="bg-black/60 border border-success/20 rounded-lg p-4 overflow-auto max-h-[200px] custom-scrollbar shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]">
                                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                                {result.finalReport}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-center gap-3">
                                    <AlertTriangle className="w-6 h-6 text-warning" />
                                    <p className="text-sm text-warning font-medium">{result.reason || "Unbekannter Systemfehler."}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
