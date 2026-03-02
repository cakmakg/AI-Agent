"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const GridCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Particle system
        const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
        const PARTICLE_COUNT = 60;
        const colors = ["rgba(0,240,255,", "rgba(57,255,20,", "rgba(255,176,0,"];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        const draw = () => {
            time += 0.003;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ── Perspective Grid ──
            const gridSpacing = 80;
            const gridAlpha = 0.04 + Math.sin(time * 2) * 0.01;

            ctx.strokeStyle = `rgba(0, 240, 255, ${gridAlpha})`;
            ctx.lineWidth = 0.5;

            // Vertical lines
            for (let x = 0; x < canvas.width; x += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // Horizontal lines
            for (let y = 0; y < canvas.height; y += gridSpacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // ── Particles ──
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                const flickerAlpha = p.alpha + Math.sin(time * 10 + p.x) * 0.1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${Math.max(0, flickerAlpha).toFixed(2)})`;
                ctx.fill();
            }

            // ── Center Core Ambient Glow ──
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
            gradient.addColorStop(0, "rgba(0, 240, 255, 0.06)");
            gradient.addColorStop(0.5, "rgba(0, 240, 255, 0.02)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

export const BackgroundGrid = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Vantablack base */}
            <div className="absolute inset-0 bg-black" />

            {/* Canvas-based animated grid + particles */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="absolute inset-0"
            >
                <GridCanvas />
            </motion.div>

            {/* Vignette overlay for depth */}
            <div
                className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
                }}
            />

            {/* Scanline overlay */}
            <div
                className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                }}
            />
        </div>
    );
};
