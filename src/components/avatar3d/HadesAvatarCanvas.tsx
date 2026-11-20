import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { HadesRobot } from "./HadesRobot";
import { useAgentStore } from "../../store/useAgentStore";

export const HadesAvatarCanvas: React.FC = () => {
  const { robotState, audioLevel, qualityPreset, reducedMotion } = useAgentStore();

  const getDpr = () => {
    switch (qualityPreset) {
      case "low":
        return 1;
      case "medium":
        return [1, 1.5] as [number, number];
      case "high":
      default:
        return [1, 2] as [number, number];
    }
  };

  return (
    <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden">
      {/* Background Holographic Circular Reticle & Grid */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Circular Radar Ring */}
        <div className="w-[300px] h-[300px] rounded-full border border-[#00f0ff]/20 animate-[spin_60s_linear_infinite]" />
        {/* Inner Radar Crosshairs */}
        <div className="w-[260px] h-[260px] rounded-full border border-dashed border-[#00f0ff]/15 animate-[spin_40s_linear_infinite_reverse]" />
        <div className="w-[180px] h-[180px] rounded-full border border-[#0066ff]/20" />
      </div>

      <Canvas
        camera={{ position: [0, 0.4, 3.6], fov: 45 }}
        dpr={getDpr()}
        gl={{ antialias: qualityPreset !== "low", powerPreference: "default" }}
        className="relative z-10"
      >
        <ambientLight intensity={0.6} />
        {/* Cyber Cyan Key Light */}
        <directionalLight position={[3, 4, 3]} intensity={1.5} color="#00f0ff" />
        {/* Subtle Blue Fill Light */}
        <directionalLight position={[-3, -2, 2]} intensity={0.8} color="#0044ff" />
        {/* Back Rim Light */}
        <directionalLight position={[0, 4, -4]} intensity={1.2} color="#88e0ff" />

        <Suspense fallback={null}>
          <HadesRobot
            state={robotState}
            audioLevel={audioLevel}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      {/* State & Audio Badge below Avatar */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-[#020813]/90 border border-[#00f0ff]/30 px-3 py-0.5 rounded-full z-20 backdrop-blur-sm">
        <span
          className={`w-2 h-2 rounded-full ${
            robotState === "ERROR"
              ? "bg-[#ff3344] animate-ping"
              : robotState === "THINKING"
              ? "bg-[#ffaa00] animate-pulse"
              : robotState === "SPEAKING"
              ? "bg-[#00f0ff] animate-ping"
              : "bg-[#00ff88]"
          }`}
        />
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff] font-['Orbitron',sans-serif]">
          CORE: {robotState}
        </span>
      </div>
    </div>
  );
};
