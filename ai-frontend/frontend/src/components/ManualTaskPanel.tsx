import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, CheckCircle2, Cpu } from 'lucide-react';
import { analyzeTask } from '../services/api';

export default function ManualTaskPanel() {
    const [task, setTask] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleRun = async () => {
        if (!task.trim()) return;
        setIsLoading(true);
        setResult(null);
        try {
            const res = await analyzeTask(task);
            if (res.success) {
                setResult(res.finalReport);
            } else {
                setResult(res.error || "Ein Fehler ist aufgetreten.");
            }
        } catch (e) {
            console.error(e);
            setResult("Verbindung zum Server fehlgeschlagen. Läuft das Backend (Express)?");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel flex flex-col h-full relative"
        >
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Manuelles Aufgabenzentrum</h2>
                        <p className="text-xs text-gray-400">Orchestrator-Steuerung</p>
                    </div>
                </div>
                <span className="text-xs font-mono bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30 shadow-neon-blue">
                    AGENT_1_READY
                </span>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-300">Aufgabendefinition</label>
                    <textarea
                        className="glass-input h-32 resize-none"
                        placeholder="Beschreiben Sie die Aufgabe für die KI-Fabrik..."
                        value={task}
                        onChange={e => setTask(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleRun}
                    disabled={isLoading || !task.trim()}
                    className="btn-cyber btn-cyber-primary flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed py-4 mt-auto"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Play className="w-5 h-5 group-hover:scale-110 transition-transform fill-current" />
                    )}
                    <span className="font-bold tracking-widest text-sm">
                        {isLoading ? "ORCHESTRIERUNG LÄUFT..." : "FABRIK STARTEN"}
                    </span>
                </button>

                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col items-center justify-center py-10 rounded-xl bg-gradient-to-b from-primary/5 to-transparent"
                        >
                            <div className="relative mb-6">
                                <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-r-2 border-secondary rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                <div className="absolute inset-4 border-b-2 border-primary/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                                <Cpu className="w-12 h-12 text-primary p-3 animate-pulse" />
                            </div>
                            <p className="text-primary font-medium animate-pulse neon-text-blue text-center text-sm tracking-wide">
                                Agenten arbeiten, Bericht wird erstellt...
                            </p>
                        </motion.div>
                    )}

                    {result && !isLoading && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4"
                        >
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <CheckCircle2 className="w-5 h-5 text-success" />
                                <h3 className="text-sm font-semibold text-success tracking-wide">Abschlussbericht Generiert</h3>
                            </div>
                            <div className="bg-black/60 border border-primary/20 rounded-xl p-5 overflow-auto max-h-[300px] custom-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                                    {result}
                                </pre>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
