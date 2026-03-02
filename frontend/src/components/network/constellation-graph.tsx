"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

const AGENTS = [
    { id: "ceo", label: "Orkestra Şefi", role: "core", color: "#00f0ff" },
    { id: "cto", label: "Baş Mimar (CTO)", role: "node", color: "#39ff14" },
    { id: "scraper", label: "Araştırmacı", role: "node", color: "#ffb000" },
    { id: "analyst", label: "Analist", role: "node", color: "#00f0ff" },
    { id: "writer", label: "İçerik Yöneticisi", role: "node", color: "#39ff14" },
    { id: "qa", label: "Eleştirmen (QA)", role: "node", color: "#ffb000" },
    { id: "hitl", label: "İnsan Yargıç", role: "node", color: "#ff4444" },
    { id: "publisher", label: "Dağıtımcı", role: "node", color: "#00f0ff" },
    { id: "radar", label: "Ar-Ge Radarı", role: "node", color: "#39ff14" },
];

const Node = ({ position, color, label, isCore }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state) => {
        if (meshRef.current) {
            if (isCore) {
                // Kalp atışı (pulsing) animasyonu
                const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
                meshRef.current.scale.set(scale, scale, scale);
            } else {
                // Düğümlerin kendi etrafında hafifçe dönmesi
                meshRef.current.rotation.y += 0.01;
            }
        }
    });

    return (
        <group position={position}>
            <Sphere ref={meshRef} args={[isCore ? 0.6 : 0.25, 32, 32]}>
                <meshStandardMaterial
                    ref={materialRef}
                    color={color}
                    emissive={color}
                    emissiveIntensity={isCore ? 2.5 : 1.5}
                    toneMapped={false}
                />
            </Sphere>
            <Html distanceFactor={15} center zIndexRange={[100, 0]}>
                <div
                    className="mt-6 px-3 py-1 rounded-sm bg-black/70 border border-white/10 backdrop-blur-md text-[10px] font-mono tracking-widest uppercase whitespace-nowrap select-none"
                    style={{ color, textShadow: `0 0 5px ${color}`, borderColor: `${color}40` }}
                >
                    {label}
                </div>
            </Html>
        </group>
    );
};

const Edges = ({ nodes }: { nodes: THREE.Vector3[] }) => {
    const corePos = nodes[0];
    return (
        <group>
            {nodes.slice(1).map((pos, i) => (
                <Line
                    key={i}
                    points={[corePos, pos]}
                    color="#ffffff"
                    opacity={0.15}
                    transparent
                    lineWidth={1}
                />
            ))}
        </group>
    );
};

export const ConstellationGraph = () => {
    const nodes = useMemo(() => {
        const arr: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)]; // Merkezde Orkestra Şefi
        const radius = 4;
        const numNodes = AGENTS.length - 1;

        for (let i = 0; i < numNodes; i++) {
            const angle = (i / numNodes) * Math.PI * 2;
            // 3 Boyut hissini artırmak için Y ekseninde sinüs varyasyonu ekliyoruz
            const y = Math.sin(angle * 3) * 1.5;
            arr.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
        }
        return arr;
    }, []);

    return (
        <div className="w-full h-full relative cursor-crosshair">
            <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                {/* Ortam ışığı ve ana ışık */}
                <ambientLight intensity={0.2} />
                <pointLight position={[0, 0, 0]} intensity={2} distance={10} color="#00f0ff" />

                <group>
                    {/* Edge Connection Lines */}
                    <Edges nodes={nodes} />

                    {/* Agent Nodes */}
                    {AGENTS.map((agent, i) => (
                        <Node
                            key={agent.id}
                            position={nodes[i]}
                            color={agent.color}
                            label={agent.label}
                            isCore={i === 0}
                        />
                    ))}
                </group>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    maxDistance={20}
                    minDistance={4}
                    autoRotate
                    autoRotateSpeed={0.8}
                />

                {/* Neon Parlama (Bloom Post-Processing) */}
                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
                </EffectComposer>
            </Canvas>

            {/* HUD Dekoratif Çizgiler */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-dashed border-white/5 rounded-full pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full pointer-events-none" />
        </div>
    );
};
