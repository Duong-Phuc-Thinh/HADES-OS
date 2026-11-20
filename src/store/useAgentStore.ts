import { create } from "zustand";
import { RobotState } from "../types";

interface AgentState {
  currentAgent: string;
  robotState: RobotState;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  qualityPreset: "low" | "medium" | "high";
  reducedMotion: boolean;
  
  setCurrentAgent: (agent: string) => void;
  setRobotState: (state: RobotState) => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setAudioLevel: (level: number) => void;
  setQualityPreset: (preset: "low" | "medium" | "high") => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  currentAgent: "HADES Orchestrator",
  robotState: "IDLE",
  isListening: false,
  isSpeaking: false,
  audioLevel: 0,
  qualityPreset: "high",
  reducedMotion: false,

  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setRobotState: (robotState) => set({ robotState }),
  setIsListening: (isListening) =>
    set({
      isListening,
      robotState: isListening ? "LISTENING" : "IDLE"
    }),
  setIsSpeaking: (isSpeaking) =>
    set({
      isSpeaking,
      robotState: isSpeaking ? "SPEAKING" : "IDLE"
    }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setQualityPreset: (qualityPreset) => set({ qualityPreset }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion })
}));
