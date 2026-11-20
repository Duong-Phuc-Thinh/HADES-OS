import { create } from "zustand";
import { HardwareMetric } from "../types";
import { api } from "../api/client";

interface SystemState {
  metrics: HardwareMetric | null;
  isLoading: boolean;
  error: string | null;
  currentTime: Date;
  isOnline: boolean;
  
  fetchMetrics: () => Promise<void>;
  updateCurrentTime: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  metrics: null,
  isLoading: false,
  error: null,
  currentTime: new Date(),
  isOnline: navigator.onLine,

  fetchMetrics: async () => {
    try {
      const data = await api.getSystemMetrics();
      set({ metrics: data, error: null, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  updateCurrentTime: () => set({ currentTime: new Date(), isOnline: navigator.onLine })
}));
