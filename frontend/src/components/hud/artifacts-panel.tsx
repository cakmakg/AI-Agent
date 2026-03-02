"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Cpu, FileCode } from "lucide-react";
import { useAgentStore } from "@/store/agent-store";

// Realistic CTO blueprint that gets typed out during CTO activity
const BLUEPRINT_LINES = [
    "# 🏗️ SYSTEM ARCHITECTURE BLUEPRINT",
    "",
    "## Tech Stack Selection",
    "```",
    "Framework:  Next.js 14 (App Router)",
    "Language:   TypeScript 5.x (strict mode)",
    "UI:         Tailwind CSS + shadcn/ui",
    "State:      Zustand + React Query",
    "Auth:       NextAuth.js v5",
    "DB:         PostgreSQL via Prisma ORM",
    "Cache:      Redis (Upstash serverless)",
    "Deploy:     Vercel + GitHub Actions CI/CD",
    "```",
    "",
    "## Module Architecture",
    "```",
    "src/",
    "├── app/              # Next.js App Router",
    "│   ├── (auth)/       # Auth layout group",
    "│   ├── (dashboard)/  # Protected routes",
    "│   └── api/          # API route handlers",
    "├── components/",
    "│   ├── ui/           # Atomic primitives",
    "│   └── features/     # Domain components",
    "├── lib/",
    "│   ├── db.ts         # Prisma client",
    "│   └── auth.ts       # NextAuth config",
    "├── hooks/            # Custom React hooks",
    "├── store/            # Zustand slices",
    "└── types/            # Global TS types",
    "```",
    "",
    "## API Design Principles",
    "- RESTful endpoints under /api/v1/*",
    "- Zod validation on all inputs",
    "- Standard ErrorResponse shape",
    "- JWT + refresh token rotation",
    "",
    "## Performance Targets",
    "- LCP < 1.2s (Largest Contentful Paint)",
    "- TTI < 2.5s (Time to Interactive)",
    "- Bundle size < 150KB gzipped",
    "- 95th percentile API latency < 200ms",
    "",
    "## Security Checklist",
    "✓ CSRF protection via SameSite cookies",
    "✓ Rate limiting: 100 req/min per IP",
    "✓ SQL injection: Parameterized queries",
    "✓ XSS: Content Security Policy headers",
    "✓ Secrets: ENV vars, never in codebase",
    "",
    "## Deployment Pipeline",
    "```yaml",
    "on: [push]",
    "jobs:",
    "  test: → jest + playwright e2e",
    "  build: → next build + type-check",
    "  deploy: → vercel --prod",
    "```",
    "",
    "## Blueprint saved to: /output/blueprint.md ✓",
];

export const ArtifactsPanel = () => {
    const ctoStatus = useAgentStore((s) => s.agents.cto.status);
    const isCtoActive = ctoStatus === "ACTIVE" || ctoStatus === "THINKING";

    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset when CTO activates
    useEffect(() => {
        if (isCtoActive) {
            setDisplayedLines([]);
            setCurrentLineIndex(0);
            setCurrentCharIndex(0);
            setIsTyping(true);
        } else {
            setIsTyping(false);
        }
    }, [isCtoActive]);

    // Typewriter effect
    useEffect(() => {
        if (!isTyping || currentLineIndex >= BLUEPRINT_LINES.length) {
            if (currentLineIndex >= BLUEPRINT_LINES.length) setIsTyping(false);
            return;
        }

        const currentLine = BLUEPRINT_LINES[currentLineIndex];

        // Blank lines — push immediately with no delay
        if (currentLine === "") {
            setDisplayedLines((prev) => [...prev, ""]);
            setCurrentLineIndex((i) => i + 1);
            setCurrentCharIndex(0);
            return;
        }

        if (currentCharIndex < currentLine.length) {
            // Type one character at a time
            const speed = currentLine.startsWith("#") ? 25
                : currentLine.startsWith("```") ? 10
                    : currentLine.startsWith("  ") ? 12
                        : 18;

            const timeout = setTimeout(() => {
                setDisplayedLines((prev) => {
                    const updated = [...prev];
                    updated[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
                    return updated;
                });
                setCurrentCharIndex((c) => c + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else {
            // Line complete — move to next
            const timeout = setTimeout(() => {
                setCurrentLineIndex((i) => i + 1);
                setCurrentCharIndex(0);
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [isTyping, currentLineIndex, currentCharIndex]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayedLines]);

    const getLineColor = (line: string) => {
        if (line.startsWith("# ")) return "text-neon-blue font-bold text-[11px]";
        if (line.startsWith("## ")) return "neon-text-green text-[10px] font-semibold";
        if (line.startsWith("```")) return "text-white/30 text-[9px]";
        if (line.startsWith("✓")) return "text-neon-green text-[10px]";
        if (line.startsWith("├") || line.startsWith("│") || line.startsWith("└")) return "text-cyber-amber text-[10px]";
        if (line.startsWith("-")) return "text-white/60 text-[10px]";
        return "text-white/50 text-[10px]";
    };

    return (
        <div className="w-full h-full flex flex-col glass-panel rounded-md border border-neon-purple/20 shadow-[0_0_30px_rgba(155,77,255,0.1)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-neon-purple/15 bg-neon-purple/5 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded border border-neon-purple/40 bg-neon-purple/10 flex items-center justify-center">
                        <Code2 size={12} className="text-neon-purple" />
                    </div>
                    <div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: "#9b4dff", textShadow: "0 0 8px rgba(155,77,255,0.6)" }}>
                            CTO Blueprint
                        </div>
                        <div className="text-[8px] font-mono text-white/25 tracking-wider">TYPEWRITER OUTPUT</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isTyping && (
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.2 }}
                            className="flex items-center gap-1.5 text-[8px] font-mono"
                            style={{ color: "#9b4dff" }}
                        >
                            <Cpu size={9} />
                            GENERATING
                        </motion.div>
                    )}
                    {!isTyping && displayedLines.length > 0 && (
                        <span className="text-[8px] font-mono text-neon-green flex items-center gap-1">
                            <FileCode size={9} /> SAVED
                        </span>
                    )}
                </div>
            </div>

            {/* Typewriter Output */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide p-4 font-mono leading-relaxed"
            >
                <AnimatePresence>
                    {displayedLines.map((line, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`whitespace-pre ${getLineColor(line)}`}
                            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                        >
                            {line}
                            {/* Blinking cursor on the active line */}
                            {i === currentLineIndex && isTyping && (
                                <span className="animate-typing-cursor ml-[1px]" style={{ color: "#9b4dff" }}>▌</span>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Idle state */}
                {!isTyping && displayedLines.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-25">
                        <Code2 size={24} className="mb-2" style={{ color: "#9b4dff" }} />
                        <span className="text-[10px] font-mono text-white/40">Waiting for CTO</span>
                        <span className="text-[8px] font-mono text-white/25 mt-1">Blueprint output will appear here</span>
                    </div>
                )}
            </div>

            {/* Bottom accent line */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-neon-purple/40 to-transparent shrink-0" />
        </div>
    );
};
