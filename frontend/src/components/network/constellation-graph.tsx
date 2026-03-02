"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useAgentStore, AgentId, AgentStatus } from "@/store/agent-store";

interface AgentConfig {
    id: AgentId;
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

// ── Data Pulse Laser ──
const DataPulse = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!meshRef.current) return;
        const t = ((state.clock.elapsedTime * 0.6) % 1);
        meshRef.current.position.lerpVectors(start, end, t);
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - t * 0.8;
    });
    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
        </mesh>
    );
};

// ── Edge Line ──
const EdgeLine = ({ start, end, color, active }: { start: THREE.Vector3; end: THREE.Vector3; color: string; active: boolean }) => {
    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([start, end]), [start, end]);
    return (
        // @ts-expect-error R3F line element differs from SVG line
        <line geometry={geometry}>
            <lineBasicMaterial color={active ? color : "#ffffff"} transparent opacity={active ? 0.4 : 0.08} />
        </line>
    );
};

// ── Radar Sweep Rings (for Scraper) ──
const RadarRings = ({ color }: { color: string }) => {
    const ref1 = useRef<THREE.Mesh>(null);
    const ref2 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ref1.current) { ref1.current.scale.setScalar(1 + Math.sin(t * 3) * 0.4); (ref1.current.material as THREE.MeshBasicMaterial).opacity = 0.3 - Math.sin(t * 3) * 0.15; }
        if (ref2.current) { ref2.current.scale.setScalar(1 + Math.sin(t * 3 + 1) * 0.4); (ref2.current.material as THREE.MeshBasicMaterial).opacity = 0.2 - Math.sin(t * 3 + 1) * 0.1; }
    });
    return (
        <>
            <mesh ref={ref1} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.5, 0.52, 32]} /><meshBasicMaterial color={color} transparent opacity={0.3} toneMapped={false} side={THREE.DoubleSide} /></mesh>
            <mesh ref={ref2} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[0.7, 0.72, 32]} /><meshBasicMaterial color={color} transparent opacity={0.2} toneMapped={false} side={THREE.DoubleSide} /></mesh>
        </>
    );
};

// ── Data Crunching Rings (for Analyst/Writer) ──
const CrunchingRings = ({ color }: { color: string }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => { if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 2; });
    return (
        <mesh ref={ref}><torusGeometry args={[0.45, 0.015, 8, 32]} /><meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} /></mesh>
    );
};

// ── Scanner Laser (for QA) ──
const ScannerLaser = ({ color, qaStatus }: { color: string; qaStatus: AgentStatus }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.3;
    });
    const laserColor = qaStatus === "ERROR" ? "#ff2d55" : qaStatus === "SUCCESS" ? "#39ff14" : color;
    return (
        <mesh ref={ref} scale={[0.6, 0.01, 0.01]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={laserColor} transparent opacity={0.7} toneMapped={false} />
        </mesh>
    );
};

// ── Transmission Ping (for Publisher) ──
const TransmissionPing = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const scale = 1 + (state.clock.elapsedTime % 2) * 1.5;
        ref.current.scale.setScalar(scale);
        (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.4 - (state.clock.elapsedTime % 2) * 0.2);
    });
    return (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

// ── Single Agent Node ──
const AgentNode = ({ agent, position }: { agent: AgentConfig; position: THREE.Vector3 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const status = useAgentStore((s) => s.agents[agent.id].status);
    const isActive = status === "ACTIVE" || status === "THINKING";

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;

        if (agent.isCore) {
            const intensity = isActive ? 0.2 : 0.12;
            const speed = isActive ? 2 : 3;
            const beat = 1 + Math.sin(t * speed) * intensity + Math.sin(t * speed * 2) * (intensity / 2);
            meshRef.current.scale.setScalar(beat);
        } else {
            meshRef.current.position.y = position.y + Math.sin(t * 1.5 + position.x * 2) * 0.1;
            if (isActive) {
                const pulse = 1 + Math.sin(t * 5) * 0.15;
                meshRef.current.scale.setScalar(pulse);
            } else {
                meshRef.current.scale.setScalar(1);
            }
        }

        if (ringRef.current) {
            ringRef.current.rotation.x = t * 0.5;
            ringRef.current.rotation.z = t * 0.3;
        }
    });

    const nodeSize = agent.isCore ? 0.55 : 0.22;
    const statusColor = status === "ERROR" ? "#ff2d55" : status === "SUCCESS" ? "#39ff14" : agent.color;
    const emissiveIntensity = isActive ? 4 : status === "SUCCESS" ? 3 : status === "ERROR" ? 3 : hovered ? 2.5 : 1.5;

    return (
        <group position={position}>
            {/* Core orbiting torus */}
            {agent.isCore && (
                <mesh ref={ringRef}>
                    <torusGeometry args={[1.2, 0.015, 16, 64]} />
                    <meshBasicMaterial color={statusColor} transparent opacity={isActive ? 0.4 : 0.15} toneMapped={false} />
                </mesh>
            )}

            {/* Per-agent active effects */}
            {isActive && agent.id === "scraper" && <RadarRings color={agent.color} />}
            {isActive && (agent.id === "analyst" || agent.id === "writer") && <CrunchingRings color={agent.color} />}
            {isActive && agent.id === "qa" && <ScannerLaser color={agent.color} qaStatus={status} />}
            {status === "SUCCESS" && agent.id === "qa" && <ScannerLaser color="#39ff14" qaStatus="SUCCESS" />}
            {status === "ERROR" && agent.id === "qa" && <ScannerLaser color="#ff2d55" qaStatus="ERROR" />}
            {(isActive || status === "SUCCESS") && agent.id === "publisher" && <TransmissionPing />}

            {/* HITL amber alarm ring */}
            {isActive && agent.id === "hitl" && (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.4, 0.43, 32]} />
                    <meshBasicMaterial color="#ffb000" transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
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
                    color={statusColor}
                    emissive={statusColor}
                    emissiveIntensity={emissiveIntensity}
                    toneMapped={false}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>

            {/* Status Label */}
            <Html distanceFactor={12} center zIndexRange={[100, 0]}>
                <div
                    className="pointer-events-none select-none flex flex-col items-center gap-1 mt-8"
                    style={{ filter: `drop-shadow(0 0 6px ${statusColor})` }}
                >
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: statusColor }}>
                        {agent.shortLabel}
                    </span>
                    {/* Status badge */}
                    {status !== "IDLE" && (
                        <span
                            className={`text-[7px] font-mono px-1.5 py-[1px] rounded-sm border ${isActive ? "animate-pulse border-current" : "border-current/40"
                                }`}
                            style={{ color: statusColor, borderColor: `${statusColor}60`, backgroundColor: `${statusColor}15` }}
                        >
                            {status}
                        </span>
                    )}
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

// ── Scene ──
const Scene = () => {
    const groupRef = useRef<THREE.Group>(null);
    const activeAgent = useAgentStore((s) => s.activeAgent);

    const nodePositions = useMemo(() => {
        const positions: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
        const radius = 4.5;
        const count = AGENTS.length - 1;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const y = Math.sin(angle * 2) * 1.2;
            positions.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }
        return positions;
    }, []);

    useFrame((state) => {
        if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    });

    const corePos = nodePositions[0];

    return (
        <group ref={groupRef}>
            {nodePositions.slice(1).map((pos, i) => {
                const agent = AGENTS[i + 1];
                const isActiveEdge = activeAgent === agent.id;
                return (
                    <React.Fragment key={`edge-${agent.id}`}>
                        <EdgeLine start={corePos} end={pos} color={agent.color} active={isActiveEdge} />
                        {isActiveEdge && <DataPulse start={corePos} end={pos} color={agent.color} />}
                    </React.Fragment>
                );
            })}

            {AGENTS.map((agent, i) => (
                <AgentNode key={agent.id} agent={agent} position={nodePositions[i]} />
            ))}
        </group>
    );
};

export const ConstellationGraph = () => {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    return (
        <div className="w-full h-full relative">
            {isMounted && (
                <Canvas camera={{ position: [0, 6, 12], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
                    <ambientLight intensity={0.15} />
                    <pointLight position={[0, 0, 0]} intensity={3} distance={15} color="#00f0ff" decay={2} />
                    <Scene />
                    <OrbitControls enablePan={false} enableZoom maxDistance={22} minDistance={5} enableDamping dampingFactor={0.05} />
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
                <div className="w-[450px] h-[450px] border border-dashed border-white/[0.04] rounded-full" style={{ animation: "hex-rotate 30s linear infinite reverse" }} />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="text-[9px] font-mono text-white/20 tracking-[0.3em] uppercase">Agent Constellation • 9 Nodes Active</span>
            </div>
        </div>
    );
};
