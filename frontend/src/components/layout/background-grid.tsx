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
        const PARTICLE_COUNT = 55;
        const colors = ["rgba(0,240,255,", "rgba(57,255,20,", "rgba(155,77,255,"];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * (canvas.width || 1920),
                y: Math.random() * (canvas.height || 1080),
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                size: Math.random() * 1.4 + 0.4,
                alpha: Math.random() * 0.35 + 0.12,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        const draw = () => {
            time += 0.003;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // ── Perspective Grid — lighter, more visible ──
            const gridSpacing = 75;
            const gridAlpha = 0.07 + Math.sin(time * 1.5) * 0.015;

            ctx.strokeStyle = `rgba(0, 200, 255, ${gridAlpha})`;
            ctx.lineWidth = 0.5;

            for (let x = 0; x < canvas.width; x += gridSpacing) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSpacing) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }

            // ── Particles ──
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                const flickerAlpha = p.alpha + Math.sin(time * 8 + p.x) * 0.08;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${Math.max(0, flickerAlpha).toFixed(2)})`;
                ctx.fill();
            }

            // ── Center Core Ambient Glow — subtle navy center light ──
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 500);
            gradient.addColorStop(0, "rgba(30, 80, 180, 0.09)");
            gradient.addColorStop(0.4, "rgba(0, 180, 255, 0.04)");
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
            {/* Deep navy base — NOT pure black */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #080d18 0%, #0b1225 50%, #07101f 100%)" }} />

            {/* Canvas animated grid + particles */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0"
            >
                <GridCanvas />
            </motion.div>

            {/* Softer vignette — less dark than before */}
            <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(4,8,18,0.55) 100%)" }}
            />

            {/* Very subtle scanlines */}
            <div
                className="absolute inset-0 opacity-[0.012] pointer-events-none"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)" }}
            />
        </div>
    );
};
