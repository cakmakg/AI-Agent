"use client";

import React from "react";
import { motion } from "framer-motion";

export const BackgroundGrid = () => {
    return (
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-black overflow-hidden flex items-center justify-center">
            {/* Center ambient glow matching the AI core (Orkestra Şefi) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.05)_0%,rgba(0,0,0,1)_60%)]" />

            {/* Cyber-Nexus Grid Pattern */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute inset-0"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
          `,
                    backgroundSize: "60px 60px",
                    backgroundPosition: "center center",
                }}
            />

            {/* Scanning Line (Subtle HUD Effect) */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #00f0ff 2px, #00f0ff 4px)"
                }}
            />
        </div>
    );
};
