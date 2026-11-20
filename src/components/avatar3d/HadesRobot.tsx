import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RobotState } from "../../types";

interface HadesRobotProps {
  state: RobotState;
  audioLevel?: number;
  reducedMotion?: boolean;
}

export const HadesRobot: React.FC<HadesRobotProps> = ({
  state,
  audioLevel = 0,
  reducedMotion = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const hudRing1Ref = useRef<THREE.Mesh>(null);
  const hudRing2Ref = useRef<THREE.Mesh>(null);
  const hudRing3Ref = useRef<THREE.Mesh>(null);

  // Materials
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#2a3442",
    metalness: 0.85,
    roughness: 0.25,
    flatShading: true
  });

  const darkSteelMaterial = new THREE.MeshStandardMaterial({
    color: "#111822",
    metalness: 0.9,
    roughness: 0.35,
    flatShading: true
  });

  const getEyeColor = (): string => {
    switch (state) {
      case "ERROR":
        return "#ff3344";
      case "THINKING":
        return "#ffaa00";
      case "SUCCESS":
        return "#00ff88";
      case "LISTENING":
      case "SPEAKING":
      case "PROCESSING":
      case "IDLE":
      default:
        return "#00f0ff";
    }
  };

  const eyeColor = getEyeColor();

  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: eyeColor
  });

  const hudRingMaterial = new THREE.MeshBasicMaterial({
    color: "#00f0ff",
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });

  useFrame((clockState) => {
    const t = clockState.clock.getElapsedTime();
    if (!reducedMotion && groupRef.current && headRef.current) {
      // Floating motion
      const floatAmp = state === "THINKING" ? 0.08 : 0.05;
      const floatSpeed = state === "THINKING" ? 2.5 : 1.5;
      groupRef.current.position.y = Math.sin(t * floatSpeed) * floatAmp;

      // Subtle head look-around or speech vibration
      if (state === "SPEAKING") {
        headRef.current.rotation.x = Math.sin(t * 12) * (0.04 + audioLevel * 0.08);
        headRef.current.rotation.y = Math.sin(t * 2) * 0.05;
      } else if (state === "THINKING") {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.15;
        headRef.current.rotation.z = Math.sin(t * 1.2) * 0.05;
      } else if (state === "LISTENING") {
        headRef.current.rotation.x = -0.05;
        headRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
      } else {
        headRef.current.rotation.y = Math.sin(t * 0.6) * 0.08;
        headRef.current.rotation.x = Math.cos(t * 0.5) * 0.03;
      }

      // Rotating Holographic Rings
      if (hudRing1Ref.current) {
        hudRing1Ref.current.rotation.z = t * 0.6;
      }
      if (hudRing2Ref.current) {
        hudRing2Ref.current.rotation.z = -t * 0.4;
        hudRing2Ref.current.rotation.x = 1.1 + Math.sin(t * 0.5) * 0.1;
      }
      if (hudRing3Ref.current) {
        hudRing3Ref.current.rotation.y = t * 0.8;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* --- HOLOGRAPHIC RINGS AROUND ROBOT --- */}
      <mesh ref={hudRing1Ref} position={[0, 0.7, 0]} rotation={[1.3, 0, 0]}>
        <ringGeometry args={[1.5, 1.52, 64]} />
        <primitive object={hudRingMaterial} attach="material" />
      </mesh>

      <mesh ref={hudRing2Ref} position={[0, 0.7, 0]} rotation={[0.8, 0.5, 0]}>
        <ringGeometry args={[1.7, 1.72, 48]} />
        <meshBasicMaterial color="#0066ff" wireframe transparent opacity={0.25} />
      </mesh>

      <mesh ref={hudRing3Ref} position={[0, 0.7, 0]}>
        <ringGeometry args={[1.9, 1.91, 32]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.18} />
      </mesh>

      {/* --- UPPER TORSO / COLLAR --- */}
      <group position={[0, -0.4, 0]}>
        {/* Chest Plate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.6, 0.5]} />
          <primitive object={darkSteelMaterial} attach="material" />
        </mesh>

        {/* Cyber Neck Joint */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.35, 16]} />
          <primitive object={metalMaterial} attach="material" />
        </mesh>

        {/* Shoulders */}
        <mesh position={[-0.75, 0.1, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.45]} />
          <primitive object={metalMaterial} attach="material" />
        </mesh>
        <mesh position={[0.75, 0.1, 0]}>
          <boxGeometry args={[0.35, 0.35, 0.45]} />
          <primitive object={metalMaterial} attach="material" />
        </mesh>

        {/* Center Reactor Core Light */}
        <mesh position={[0, 0.05, 0.26]}>
          <circleGeometry args={[0.12, 24]} />
          <meshBasicMaterial color={eyeColor} />
        </mesh>
      </group>

      {/* --- ROBOT HEAD --- */}
      <group ref={headRef} position={[0, 0.6, 0]}>
        {/* Main Cranium (Low-poly metallic bevel) */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.8, 0.85, 0.8]} />
          <primitive object={metalMaterial} attach="material" />
        </mesh>

        {/* Face Shield / Visor Front Plate */}
        <mesh position={[0, 0.05, 0.38]}>
          <boxGeometry args={[0.72, 0.5, 0.12]} />
          <primitive object={darkSteelMaterial} attach="material" />
        </mesh>

        {/* Jaw / Chin Guard */}
        <mesh position={[0, -0.3, 0.25]}>
          <boxGeometry args={[0.5, 0.25, 0.35]} />
          <primitive object={darkSteelMaterial} attach="material" />
        </mesh>

        {/* GLOWING CYAN EYES */}
        {/* Left Eye */}
        <mesh ref={eyeLeftRef} position={[-0.18, 0.12, 0.45]}>
          <boxGeometry args={[0.18, 0.07, 0.04]} />
          <primitive object={eyeMaterial} attach="material" />
        </mesh>
        {/* Right Eye */}
        <mesh ref={eyeRightRef} position={[0.18, 0.12, 0.45]}>
          <boxGeometry args={[0.18, 0.07, 0.04]} />
          <primitive object={eyeMaterial} attach="material" />
        </mesh>

        {/* HEADPHONES / CYBER EARS */}
        {/* Left Ear Module */}
        <group position={[-0.46, 0.1, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
            <primitive object={metalMaterial} attach="material" />
          </mesh>
          <mesh position={[-0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <circleGeometry args={[0.14, 16]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        </group>

        {/* Right Ear Module */}
        <group position={[0.46, 0.1, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
            <primitive object={metalMaterial} attach="material" />
          </mesh>
          <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <circleGeometry args={[0.14, 16]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
        </group>

        {/* Crown Antenna / Sensors */}
        <mesh position={[0, 0.58, -0.1]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.2, 0.25]} />
          <primitive object={metalMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
};
