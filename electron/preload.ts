import { contextBridge, ipcRenderer } from "electron";

export interface BackendInfo {
  port: number;
  sessionToken: string;
  baseUrl: string;
}

export interface HadesApi {
  getBackendInfo: () => Promise<BackendInfo>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  openExternal: (url: string) => Promise<boolean>;
  platform: string;
}

const hadesApi: HadesApi = {
  getBackendInfo: () => ipcRenderer.invoke("hades:get-backend-info"),
  minimizeWindow: () => ipcRenderer.send("hades:window-minimize"),
  maximizeWindow: () => ipcRenderer.send("hades:window-maximize"),
  closeWindow: () => ipcRenderer.send("hades:window-close"),
  openExternal: (url: string) => ipcRenderer.invoke("hades:open-external", url),
  platform: process.platform
};

// Expose strictly typed API to renderer sandbox
contextBridge.exposeInMainWorld("hadesApi", hadesApi);
