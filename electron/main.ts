import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import { BackendConfig, BackendManager } from "./backend-manager";

let mainWindow: BrowserWindow | null = null;
let backendManager: BackendManager | null = null;

async function createWindow() {
  backendManager = new BackendManager(8765);
  let backendConfig: BackendConfig | undefined;
  try {
    backendConfig = await backendManager.start();
  } catch (err) {
    console.error("Lỗi khi khởi chạy Backend:", err);
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Futuristic custom HUD border and title bar
    backgroundColor: "#020813",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  // Strict Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https://fonts.googleapis.com https://fonts.gstatic.com;"
        ]
      }
    });
  });

  // IPC Handlers
  ipcMain.handle("hades:get-backend-info", () => {
    return backendConfig || backendManager?.getConfig();
  });

  ipcMain.on("hades:window-minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.on("hades:window-maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on("hades:window-close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("hades:open-external", async (_event, url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        await shell.openExternal(url);
        return true;
      }
    } catch (e) {
      console.warn("Chặn mở URL không an toàn:", url);
    }
    return false;
  });

  // Load URL
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (backendManager) {
      backendManager.stop();
    }
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendManager) {
    backendManager.stop();
  }
});
