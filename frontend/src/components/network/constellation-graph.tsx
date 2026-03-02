"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

interface AgentConfig {
    id: string;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    isCore: boolean;
}

const AGENTS: AgentConfig[] = [
    { id: "ceo", label: "Orkestra Şefi", shortLabel: "CEO", icon: "👨‍💼", color: "#00f0ff", isCore: true },
    { id: "cto", label: "Baş Mimar", shortLabel: "CTO", icon: "👨‍💻", color: "#39ff14", isCore: false },
    { id: "scraper", label: "Araştırmacı", shortLabel: "SCR", icon: "🕵️", color: "#ffb000", isCore: false },
    { id: "analyst", label: "Analist", shortLabel: "ANL", icon: "🧠", color: "#00f0ff", isCore: false },
    { id: "writer", label: "İçerik Yön.", shortLabel: "WRT", icon: "✍️", color: "#39ff14", isCore: false },
    { id: "qa", label: "Eleştirmen", shortLabel: "QA", icon: "🧐", color: "#ffb000", isCore: false },
    { id: "hitl", label: "İnsan Yargıç", shortLabel: "HITL", icon: "👨‍⚖️", color: "#ff2d55", isCore: false },
    { id: "publisher", label: "Dağıtımcı", shortLabel: "PUB", icon: "📢", color: "#00f0ff", isCore: false },
    { id: "radar", label: "Ar-Ge Radar", shortLabel: "RDR", icon: "🔬", color: "#39ff14", isCore: false },
];

// ── Data Pulse (Laser beam between core and node) ──
const DataPulse = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = ((state.clock.elapsedTime * 0.5) % 1);
        const pos = new THREE.Vector3().lerpVectors(start, end, t);
        meshRef.current.position.copy(pos);
        // Pulse fades as it reaches the end
        const material = meshRef.current.material as THREE.MeshBasicMaterial;
        material.opacity = 1 - t * 0.7;
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} toneMapped={false} />
        </mesh>
    );
};

// ── Edge Line (connection between core and node) ──
const EdgeLine = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
    const geometry = useMemo(() => {
        return new THREE.BufferGeometry().setFromPoints([start, end]);
    }, [start, end]);

    return (
        // @ts-expect-error R3F line element differs from SVG line
        <line geometry={geometry}>
            <lineBasicMaterial color={color} transparent opacity={0.12} />
        </line>
    );
};

// ── Single Agent Node ──
const AgentNode = ({ agent, position }: { agent: AgentConfig; position: THREE.Vector3 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;

        if (agent.isCore) {
            // Heartbeat pulsing for the core
            const beat = 1 + Math.sin(t * 3) * 0.12 + Math.sin(t * 6) * 0.05;
            meshRef.current.scale.setScalar(beat);
        } else {
            // Gentle float
            meshRef.current.position.y = position.y + Math.sin(t * 1.5 + position.x * 2) * 0.15;
        }

        if (ringRef.current) {
            ringRef.current.rotation.x = t * 0.5;
            ringRef.current.rotation.z = t * 0.3;
        }
    });

    const nodeSize = agent.isCore ? 0.55 : 0.2;
    const emissiveIntensity = hovered ? 4 : agent.isCore ? 3 : 1.8;

    return (
        <group position={position}>
            {/* Outer ring for core */}
            {agent.isCore && (
                <mesh ref={ringRef}>
                    <torusGeometry args={[1.2, 0.015, 16, 64]} />
                    <meshBasicMaterial color={agent.color} transparent opacity={0.2} toneMapped={false} />
                </mesh>
            )}

            {/* Main sphere */}
            <Sphere
                ref={meshRef}
                args={[nodeSize, 32, 32]}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color={agent.color}
                    emissive={agent.color}
                    emissiveIntensity={emissiveIntensity}
                    toneMapped={false}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>

            {/* Label */}
            <Html distanceFactor={12} center zIndexRange={[100, 0]}>
                <div
                    className="pointer-events-none select-none flex flex-col items-center gap-1 mt-8"
                    style={{ filter: `drop-shadow(0 0 6px ${agent.color})` }}
                >
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: agent.color }}>
                        {agent.shortLabel}
                    </span>
                    {hovered && (
                        <span className="text-[8px] font-mono text-white/60 bg-black/70 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                            {agent.icon} {agent.label}
                        </span>
                    )}
                </div>
            </Html>
        </group>
    );
};

// ── Main Scene ──
const Scene = () => {
    const groupRef = useRef<THREE.Group>(null);

    const nodePositions = useMemo(() => {
        const positions: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // Core
        const radius = 4.5;
        const count = AGENTS.length - 1;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const y = Math.sin(angle * 2) * 1.2;
            positions.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    y,
                    Math.sin(angle) * radius
                )
            );
        }
        return positions;
    }, []);

    // Slow scene rotation
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    const corePos = nodePositions[0];

    return (
        <group ref={groupRef}>
            {/* Edges + Data Pulses */}
            {nodePositions.slice(1).map((pos, i) => (
                <React.Fragment key={`edge-${i}`}>
                    <EdgeLine start={corePos} end={pos} color={AGENTS[i + 1].color} />
                    {/* Stagger pulses so they don't all fire at once */}
                    {i % 3 === 0 && <DataPulse start={corePos} end={pos} color={AGENTS[i + 1].color} />}
                </React.Fragment>
            ))}

            {/* Agent Nodes */}
            {AGENTS.map((agent, i) => (
                <AgentNode key={agent.id} agent={agent} position={nodePositions[i]} />
            ))}
        </group>
    );
};

export const ConstellationGraph = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <div className="w-full h-full relative">
            {isMounted && (
                <Canvas
                    camera={{ position: [0, 6, 12], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: "transparent" }}
                >
                    <ambientLight intensity={0.15} />
                    <pointLight position={[0, 0, 0]} intensity={3} distance={15} color="#00f0ff" decay={2} />

                    <Scene />

                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        maxDistance={22}
                        minDistance={5}
                        autoRotate={false}
                        enableDamping
                        dampingFactor={0.05}
                    />

                    <EffectComposer enableNormalPass={false}>
                        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.8} radius={0.85} />
                    </EffectComposer>
                </Canvas>
            )}

            {/* HUD Overlay Rings */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[650px] h-[650px] border border-neon-blue/5 rounded-full animate-hex-rotate" />
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[450px] h-[450px] border border-dashed border-white/[0.04] rounded-full" style={{ animationDirection: "reverse", animation: "hex-rotate 30s linear infinite reverse" }} />
            </div>

            {/* Center Label */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="text-[9px] font-mono text-white/20 tracking-[0.3em] uppercase">
                    Agent Constellation • 9 Nodes Active
                </span>
            </div>
        </div>
    );
};
