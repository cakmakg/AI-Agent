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
    { id: "cto", label: "Baş Mimar", shortLabel: "CTO", icon: "👨‍💻", color: "#9b4dff", isCore: false },
    { id: "scraper", label: "Araştırmacı", shortLabel: "SCR", icon: "🕵️", color: "#ffb000", isCore: false },
    { id: "analyst", label: "Analist", shortLabel: "ANL", icon: "🧠", color: "#00f0ff", isCore: false },
    { id: "writer", label: "İçerik Yön.", shortLabel: "WRT", icon: "✍️", color: "#39ff14", isCore: false },
    { id: "qa", label: "Eleştirmen", shortLabel: "QA", icon: "🧐", color: "#ffb000", isCore: false },
    { id: "hitl", label: "İnsan Yargıç", shortLabel: "HITL", icon: "👨‍⚖️", color: "#ff2d55", isCore: false },
    { id: "publisher", label: "Dağıtımcı", shortLabel: "PUB", icon: "📡", color: "#00f0ff", isCore: false },
    { id: "radar", label: "Ar-Ge Radar", shortLabel: "RDR", icon: "🔬", color: "#39ff14", isCore: false },
];

// ── Forward Data Pulse: CEO → target agent ──
const DataPulse = ({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!meshRef.current) return;
        const t = (state.clock.elapsedTime * 0.6) % 1;
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

// ── Reverse Electric Pulse: Cron (radar) → CEO ──
// A brighter, faster pulse that travels from a node to the core
const ElectricPulse = ({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) => {
    const mesh1 = useRef<THREE.Mesh>(null);
    const mesh2 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        // Two staggered pulses for electric arc effect
        const t1 = (state.clock.elapsedTime * 1.2) % 1;
        const t2 = (state.clock.elapsedTime * 1.2 + 0.5) % 1;
        if (mesh1.current) {
            mesh1.current.position.lerpVectors(from, to, t1);
            (mesh1.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t1 * Math.PI) * 0.9;
        }
        if (mesh2.current) {
            mesh2.current.position.lerpVectors(from, to, t2);
            (mesh2.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t2 * Math.PI) * 0.6;
        }
    });
    return (
        <>
            <mesh ref={mesh1}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
            </mesh>
            <mesh ref={mesh2}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.7} toneMapped={false} />
            </mesh>
        </>
    );
};

// ── Edge Line ──
const EdgeLine = ({ start, end, color, active }: { start: THREE.Vector3; end: THREE.Vector3; color: string; active: boolean }) => {
    const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([start, end]), [start, end]);
    return (
        // @ts-expect-error R3F line element differs from SVG line
        <line geometry={geometry}>
            <lineBasicMaterial color={active ? color : "#ffffff"} transparent opacity={active ? 0.45 : 0.08} />
        </line>
    );
};

// ── Radar Sweep Rings (Scraper) ──
const RadarRings = ({ color }: { color: string }) => {
    const ref1 = useRef<THREE.Mesh>(null);
    const ref2 = useRef<THREE.Mesh>(null);
    const ref3 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        if (ref1.current) { ref1.current.scale.setScalar(1 + (t * 1.5 % 1) * 0.8); (ref1.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - (t * 1.5 % 1) * 0.4; }
        if (ref2.current) { ref2.current.scale.setScalar(1 + ((t * 1.5 + 0.33) % 1) * 0.8); (ref2.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - ((t * 1.5 + 0.33) % 1) * 0.4; }
        if (ref3.current) { ref3.current.scale.setScalar(1 + ((t * 1.5 + 0.66) % 1) * 0.8); (ref3.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - ((t * 1.5 + 0.66) % 1) * 0.4; }
    });
    const ring = (ref: React.RefObject<THREE.Mesh | null>) => (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.45, 0.47, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
    return <>{ring(ref1)}{ring(ref2)}{ring(ref3)}</>;
};

// ── Data Crunching Rings (Analyst/Writer) ──
const CrunchingRings = ({ color }: { color: string }) => {
    const ring1 = useRef<THREE.Mesh>(null);
    const ring2 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ring1.current) ring1.current.rotation.z = state.clock.elapsedTime * 2;
        if (ring2.current) ring2.current.rotation.z = -state.clock.elapsedTime * 1.5;
    });
    return (
        <>
            <mesh ref={ring1}><torusGeometry args={[0.42, 0.012, 8, 32]} /><meshBasicMaterial color={color} transparent opacity={0.45} toneMapped={false} /></mesh>
            <mesh ref={ring2}><torusGeometry args={[0.55, 0.008, 8, 32]} /><meshBasicMaterial color={color} transparent opacity={0.25} toneMapped={false} /></mesh>
        </>
    );
};

// ── QA Scanner Laser ──
const ScannerLaser = ({ qaStatus }: { qaStatus: AgentStatus }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.35;
    });
    const color = qaStatus === "ERROR" ? "#ff2d55" : qaStatus === "SUCCESS" ? "#39ff14" : "#ffb000";
    return (
        <mesh ref={ref} scale={[0.65, 0.008, 0.008]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
        </mesh>
    );
};

// ── QA Verdict Wave ──
const VerdictWave = ({ success }: { success: boolean }) => {
    const ref = useRef<THREE.Mesh>(null);
    const startTime = useRef(Date.now());
    useFrame(() => {
        if (!ref.current) return;
        const elapsed = (Date.now() - startTime.current) / 1000;
        const scale = 1 + elapsed * 1.5;
        ref.current.scale.setScalar(scale);
        (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - elapsed * 0.4);
    });
    return (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.43, 32]} />
            <meshBasicMaterial color={success ? "#39ff14" : "#ff2d55"} transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
};

// ── Publisher Transmission Ping ──
const TransmissionPing = () => {
    const ring1 = useRef<THREE.Mesh>(null);
    const ring2 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const t1 = (state.clock.elapsedTime * 0.7) % 1;
        const t2 = (state.clock.elapsedTime * 0.7 + 0.5) % 1;
        if (ring1.current) { ring1.current.scale.setScalar(1 + t1 * 2.5); (ring1.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - t1 * 0.5; }
        if (ring2.current) { ring2.current.scale.setScalar(1 + t2 * 2.5); (ring2.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - t2 * 0.5; }
    });
    const ring = (ref: React.RefObject<THREE.Mesh | null>) => (
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.33, 32]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
    );
    return <>{ring(ring1)}{ring(ring2)}</>;
};

// ── CTO Hologram Glow ──
const HologramGlow = () => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (ref.current) {
            (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
            ref.current.rotation.y = state.clock.elapsedTime * 1.5;
        }
    });
    return (
        <mesh ref={ref} rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[0.5, 0.1, 6, 6]} />
            <meshBasicMaterial color="#9b4dff" transparent opacity={0.2} toneMapped={false} wireframe />
        </mesh>
    );
};

// ── HITL Alarm Rings ──
const HitlAlarmRings = () => {
    const ref1 = useRef<THREE.Mesh>(null);
    const ref2 = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        const pulse = Math.sin(state.clock.elapsedTime * 8);
        if (ref1.current) (ref1.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + pulse * 0.2;
        if (ref2.current) { ref2.current.scale.setScalar(1 + (state.clock.elapsedTime * 2 % 1) * 0.5); (ref2.current.material as THREE.MeshBasicMaterial).opacity = 0.4 - (state.clock.elapsedTime * 2 % 1) * 0.4; }
    });
    return (
        <>
            <mesh ref={ref1} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.38, 0.41, 32]} />
                <meshBasicMaterial color="#ffb000" transparent opacity={0.35} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={ref2} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.38, 0.40, 32]} />
                <meshBasicMaterial color="#ffb000" transparent opacity={0.4} toneMapped={false} side={THREE.DoubleSide} />
            </mesh>
        </>
    );
};

// ── CEO Core Node with Purple/Blue Gradient Breathing ──
const CeoCore = ({ position }: { position: THREE.Vector3 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const colorRef = useRef(new THREE.Color("#00f0ff"));
    const [hovered, setHovered] = useState(false);
    const status = useAgentStore((s) => s.agents.ceo.status);
    const isActive = status === "THINKING" || status === "ACTIVE";

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;

        // Breathing scale
        const intensity = isActive ? 0.25 : 0.1;
        const speed = isActive ? 1.5 : 0.8;
        const beat = 1 + Math.sin(t * speed) * intensity + Math.sin(t * speed * 2.5) * (intensity * 0.4);
        meshRef.current.scale.setScalar(beat);

        // Purple/blue color breathing — shifts between #00f0ff and #9b4dff
        const lerp = (Math.sin(t * (isActive ? 2 : 0.6)) + 1) / 2;
        colorRef.current.set(lerp < 0.5 ? "#00f0ff" : "#9b4dff");
        if (meshRef.current.material) {
            (meshRef.current.material as THREE.MeshStandardMaterial).emissive = colorRef.current;
            (meshRef.current.material as THREE.MeshStandardMaterial).color = colorRef.current;
        }

        if (ringRef.current) {
            ringRef.current.rotation.x = t * 0.4;
            ringRef.current.rotation.z = t * 0.25;
            (ringRef.current.material as THREE.MeshBasicMaterial).color.set(colorRef.current);
        }
    });

    const statusColor = status === "ERROR" ? "#ff2d55" : status === "SUCCESS" ? "#39ff14" : "#00f0ff";

    return (
        <group position={position}>
            {/* Orbiting torus */}
            <mesh ref={ringRef}>
                <torusGeometry args={[1.2, 0.015, 16, 64]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={isActive ? 0.45 : 0.15} toneMapped={false} />
            </mesh>

            {/* Outer halo ring for active state */}
            {isActive && (
                <mesh rotation={[Math.PI / 4, 0, 0]}>
                    <torusGeometry args={[0.9, 0.008, 8, 48]} />
                    <meshBasicMaterial color="#9b4dff" transparent opacity={0.3} toneMapped={false} />
                </mesh>
            )}

            <Sphere
                ref={meshRef}
                args={[0.55, 32, 32]}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color="#00f0ff"
                    emissive="#00f0ff"
                    emissiveIntensity={isActive ? 5 : 2.5}
                    toneMapped={false}
                    roughness={0.1}
                    metalness={0.9}
                />
            </Sphere>

            <Html distanceFactor={12} center zIndexRange={[100, 0]}>
                <div className="pointer-events-none select-none flex flex-col items-center gap-1 mt-10" style={{ filter: `drop-shadow(0 0 8px ${statusColor})` }}>
                    <span className="text-[10px] font-mono font-bold tracking-[0.25em] uppercase" style={{ color: statusColor }}>CEO</span>
                    {status !== "IDLE" && (
                        <span className="text-[7px] font-mono px-1.5 py-[1px] rounded-sm border animate-pulse" style={{ color: statusColor, borderColor: `${statusColor}60`, backgroundColor: `${statusColor}15` }}>
                            {status}
                        </span>
                    )}
                    {hovered && <span className="text-[8px] font-mono text-white/60 bg-black/70 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">👨‍💼 Orkestra Şefi</span>}
                </div>
            </Html>
        </group>
    );
};

// ── Single Agent Node (non-CEO) ──
const AgentNode = ({ agent, position }: { agent: AgentConfig; position: THREE.Vector3 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const status = useAgentStore((s) => s.agents[agent.id].status);
    const isActive = status === "ACTIVE" || status === "THINKING";

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.position.y = position.y + Math.sin(t * 1.5 + position.x * 2) * 0.1;
        if (isActive) {
            meshRef.current.scale.setScalar(1 + Math.sin(t * 5) * 0.18);
        } else {
            meshRef.current.scale.setScalar(1);
        }
    });

    const statusColor = status === "ERROR" ? "#ff2d55" : status === "SUCCESS" ? "#39ff14" : agent.color;
    const emissiveIntensity = isActive ? 4.5 : status === "SUCCESS" ? 3 : status === "ERROR" ? 3 : hovered ? 2.5 : 1.5;

    return (
        <group position={position}>
            {/* Per-agent ACTIVE effects */}
            {isActive && agent.id === "scraper" && <RadarRings color={agent.color} />}
            {isActive && agent.id === "analyst" && <CrunchingRings color={agent.color} />}
            {isActive && agent.id === "writer" && <CrunchingRings color={agent.color} />}
            {isActive && agent.id === "qa" && <ScannerLaser qaStatus={status} />}
            {isActive && agent.id === "cto" && <HologramGlow />}
            {isActive && agent.id === "hitl" && <HitlAlarmRings />}

            {/* QA verdict waves */}
            {status === "SUCCESS" && agent.id === "qa" && <VerdictWave success={true} />}
            {status === "ERROR" && agent.id === "qa" && <VerdictWave success={false} />}

            {/* Publisher transmission */}
            {(isActive || status === "SUCCESS") && agent.id === "publisher" && <TransmissionPing />}

            <Sphere
                ref={meshRef}
                args={[0.22, 32, 32]}
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

            <Html distanceFactor={12} center zIndexRange={[100, 0]}>
                <div className="pointer-events-none select-none flex flex-col items-center gap-1 mt-8" style={{ filter: `drop-shadow(0 0 6px ${statusColor})` }}>
                    <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: statusColor }}>{agent.shortLabel}</span>
                    {status !== "IDLE" && (
                        <span className={`text-[7px] font-mono px-1.5 py-[1px] rounded-sm border ${isActive ? "animate-pulse border-current" : "border-current/40"}`}
                            style={{ color: statusColor, borderColor: `${statusColor}60`, backgroundColor: `${statusColor}15` }}>
                            {status}
                        </span>
                    )}
                    {hovered && <span className="text-[8px] font-mono text-white/60 bg-black/70 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">{agent.icon} {agent.label}</span>}
                </div>
            </Html>
        </group>
    );
};

// ── Scene ──
const Scene = () => {
    const groupRef = useRef<THREE.Group>(null);
    const activeAgent = useAgentStore((s) => s.activeAgent);
    const radarStatus = useAgentStore((s) => s.agents.radar.status);
    const isRdActive = radarStatus === "ACTIVE" || radarStatus === "THINKING";

    const nodePositions = useMemo(() => {
        // CEO at center
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
            {/* Edges + Forward pulses (CEO → active agent) */}
            {nodePositions.slice(1).map((pos, i) => {
                const agent = AGENTS[i + 1];
                const isActiveEdge = activeAgent === agent.id;
                const isRdEdge = agent.id === "radar" && isRdActive;
                return (
                    <React.Fragment key={`edge-${agent.id}`}>
                        <EdgeLine start={corePos} end={pos} color={agent.color} active={isActiveEdge || isRdEdge} />
                        {/* Forward pulse: CEO → agent */}
                        {isActiveEdge && agent.id !== "radar" && <DataPulse start={corePos} end={pos} color={agent.color} />}
                        {/* Reverse electric pulse: Radar → CEO (Cron Job wakes the Orchestrator) */}
                        {isRdEdge && <ElectricPulse from={pos} to={corePos} color="#39ff14" />}
                    </React.Fragment>
                );
            })}

            {/* CEO Core */}
            <CeoCore position={corePos} />

            {/* Other Agent Nodes */}
            {AGENTS.slice(1).map((agent, i) => (
                <AgentNode key={agent.id} agent={agent} position={nodePositions[i + 1]} />
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
                <Canvas camera={{ position: [0, 6, 13], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
                    <ambientLight intensity={0.12} />
                    <pointLight position={[0, 0, 0]} intensity={4} distance={18} color="#00f0ff" decay={2} />
                    <pointLight position={[0, 8, 0]} intensity={1} distance={12} color="#9b4dff" decay={2} />
                    <Scene />
                    <OrbitControls enablePan={false} enableZoom maxDistance={22} minDistance={5} enableDamping dampingFactor={0.05} />
                    <EffectComposer enableNormalPass={false}>
                        <Bloom luminanceThreshold={0.12} mipmapBlur intensity={2.0} radius={0.9} />
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
                <span className="text-[9px] font-mono text-white/20 tracking-[0.3em] uppercase">Agent Constellation • 9 Nodes Active</span>
            </div>
        </div>
    );
};
