import { ChildProcess, spawn } from "child_process";
import crypto from "crypto";
import http from "http";
import path from "path";

export interface BackendConfig {
  port: number;
  sessionToken: string;
  baseUrl: string;
}

export class BackendManager {
  private process: ChildProcess | null = null;
  private config: BackendConfig;
  private isShuttingDown: boolean = false;

  constructor(port: number = 8765) {
    const sessionToken = crypto.randomBytes(32).toString("hex");
    this.config = {
      port,
      sessionToken,
      baseUrl: `http://127.0.0.1:${port}`
    };
  }

  public getConfig(): BackendConfig {
    return this.config;
  }

  public async start(): Promise<BackendConfig> {
    const rootDir = path.resolve(__dirname, "..");
    const venvPython = process.platform === "win32"
      ? path.join(rootDir, ".venv", "Scripts", "python.exe")
      : path.join(rootDir, ".venv", "bin", "python");

    // Check if packaged sidecar binary exists
    const sidecarBinary = path.join(process.resourcesPath || rootDir, "backend", "hades-backend.exe");
    const useSidecar = process.env.NODE_ENV === "production" && require("fs").existsSync(sidecarBinary);

    const env = {
      ...process.env,
      HADES_PORT: this.config.port.toString(),
      HADES_SESSION_TOKEN: this.config.sessionToken,
      PYTHONPATH: rootDir
    };

    console.log(`[HadesBackendManager] Khởi động Backend tại cổng ${this.config.port}...`);

    if (useSidecar) {
      this.process = spawn(sidecarBinary, [], { env, stdio: "pipe" });
    } else {
      this.process = spawn(venvPython, ["-m", "backend.app.main"], {
        cwd: rootDir,
        env,
        stdio: "pipe"
      });
    }

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => {
        console.log(`[Backend stdout]: ${data.toString().trim()}`);
      });
    }

    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => {
        console.warn(`[Backend stderr]: ${data.toString().trim()}`);
      });
    }

    this.process.on("exit", (code, signal) => {
      console.log(`[HadesBackendManager] Tiến trình Backend đã dừng (code: ${code}, signal: ${signal})`);
      if (!this.isShuttingDown) {
        console.error("[HadesBackendManager] CẢNH BÁO: Backend dừng đột ngột!");
      }
    });

    // Wait for /api/health probe
    await this.waitForHealth(30, 500);
    console.log("[HadesBackendManager] Backend đã sẵn sàng và xác thực thành công!");
    return this.config;
  }

  private async waitForHealth(maxAttempts: number = 30, intervalMs: number = 500): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      if (this.isShuttingDown) return false;
      const ok = await this.checkHealth();
      if (ok) return true;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Không thể kết nối đến HADES Backend sau ${maxAttempts * intervalMs}ms.`);
  }

  private checkHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`${this.config.baseUrl}/api/health`, { timeout: 1000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  public stop(): void {
    this.isShuttingDown = true;
    if (this.process) {
      console.log("[HadesBackendManager] Đang tắt tiến trình Backend một cách an toàn...");
      if (process.platform === "win32" && this.process.pid) {
        try {
          spawn("taskkill", ["/pid", this.process.pid.toString(), "/T", "/F"]);
        } catch (e) {
          this.process.kill();
        }
      } else {
        this.process.kill("SIGTERM");
      }
      this.process = null;
    }
  }
}
