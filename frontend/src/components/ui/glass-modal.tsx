"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, AlertTriangle } from "lucide-react";
import { Signal } from "../radar/signal-inbox";

type Props = {
    isOpen: boolean;
    signal: Signal | null;
    onClose: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
};

export const GlassModal = ({ isOpen, signal, onClose, onApprove, onReject }: Props) => {
    return (
        <AnimatePresence>
            {isOpen && signal && (
                <React.Fragment>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-[#0a0a0a] border border-cyber-amber/30 rounded-lg shadow-[0_0_50px_rgba(255,176,0,0.15)] overflow-hidden flex flex-col relative pointer-events-auto"
                        >
                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-amber to-transparent opacity-50" />

                            {/* Header */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-medium text-white flex items-center gap-2">
                                        <AlertTriangle className="text-cyber-amber" size={20} />
                                        İnsan Yargıç (HITL) Onayı Bekleniyor
                                    </h2>
                                    <p className="font-mono text-[10px] opacity-50 mt-1 uppercase">
                                        ID: {signal.id} // SRC: {signal.source}
                                    </p>
                                </div>
                                <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 flex-1 min-h-[220px] flex flex-col font-mono text-sm leading-relaxed">
                                <div className="bg-white/5 border border-white/10 rounded p-4 mb-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-cyber-amber" />
                                    <h3 className="text-neon-blue mb-2 font-bold">{signal.title}</h3>
                                    <p className="opacity-80 text-xs text-white/80">
                                        Ajan Swarm görevini tamamladı ve <span className="text-neon-green">output</span> dosyasını hazırladı. Sistemin dış dünyaya (veya üretim ortamına) veri göndermeden önceki son güvenlik duvarı sizsiniz.
                                        <br /><br />
                                        Lütfen içeriği inceleyip onay verin veya revizyon için reddedin.
                                    </p>
                                </div>

                                <div className="flex gap-4 opacity-80 text-[10px] bg-black/50 p-3 rounded border border-white/5">
                                    <div className="flex-1 border-l-2 border-white/20 pl-3">
                                        <span className="block opacity-50 mb-1">DURUM</span>
                                        <span className="text-cyber-amber font-bold">{signal.status}</span>
                                    </div>
                                    <div className="flex-1 border-l-2 border-white/20 pl-3">
                                        <span className="block opacity-50 mb-1">ACİLİYET</span>
                                        <span className={signal.urgency === 'HIGH' ? 'text-red-500 font-bold' : 'text-white'}>{signal.urgency}</span>
                                    </div>
                                    <div className="flex-1 border-l-2 border-white/20 pl-3">
                                        <span className="block opacity-50 mb-1">ZAMAN</span>
                                        {signal.timestamp}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-white/5 flex justify-end gap-3 border-t border-white/10">
                                <button
                                    onClick={() => onReject(signal.id)}
                                    className="px-6 py-2 rounded font-mono text-[10px] font-bold uppercase tracking-widest border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    Reject & Rewrite
                                </button>
                                <button
                                    onClick={() => onApprove(signal.id)}
                                    className="px-6 py-2 rounded font-mono text-[10px] font-bold uppercase tracking-widest bg-cyber-amber/20 border border-cyber-amber text-cyber-amber hover:bg-cyber-amber/30 transition-colors flex items-center gap-2"
                                >
                                    <ShieldCheck size={16} /> Approve Execution
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
};
