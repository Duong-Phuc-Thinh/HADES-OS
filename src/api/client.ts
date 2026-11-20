import {
  HardwareMetric,
  ChatMessage,
  Conversation,
  FinanceAccount,
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  RegisteredProject,
  GitStatus,
  TaskItem,
  NotificationItem
} from "../types";

let cachedToken = "";
let cachedBaseUrl = "http://127.0.0.1:8765";

// Declare window hadesApi interface
declare global {
  interface Window {
    hadesApi?: {
      getBackendInfo: () => Promise<{ port: number; sessionToken: string; baseUrl: string }>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      openExternal: (url: string) => Promise<boolean>;
      platform: string;
    };
  }
}

export async function initApiClient() {
  if (window.hadesApi) {
    try {
      const info = await window.hadesApi.getBackendInfo();
      if (info) {
        cachedToken = info.sessionToken;
        cachedBaseUrl = info.baseUrl;
      }
    } catch (e) {
      console.warn("Lỗi khi kết nối IPC Electron:", e);
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!cachedToken && window.hadesApi) {
    await initApiClient();
  }

  const url = `${cachedBaseUrl}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (cachedToken) {
    headers.set("Authorization", `Bearer ${cachedToken}`);
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // System
  getHealth: () => request<{ status: string; uptime_seconds: number }>("/api/health"),
  getSystemMetrics: () => request<HardwareMetric>("/api/system/metrics"),

  // Chat
  sendMessage: (content: string, conversation_id?: string) =>
    request<{
      conversation_id: string;
      message_id: string;
      reply: string;
      agent_name: string;
      tool_invocations: any[];
    }>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ content, conversation_id })
    }),
  streamChat: async (
    prompt: string,
    conversation_id: string | undefined,
    onEvent: (eventType: string, data: any) => void,
    signal?: AbortSignal
  ) => {
    if (!cachedToken && window.hadesApi) {
      await initApiClient();
    }
    const q = new URLSearchParams({ prompt });
    if (conversation_id) q.set("conversation_id", conversation_id);
    if (cachedToken) q.set("token", cachedToken);

    const url = `${cachedBaseUrl}/api/chat/stream?${q.toString()}`;
    const headers = new Headers();
    if (cachedToken) headers.set("Authorization", `Bearer ${cachedToken}`);

    const res = await fetch(url, { headers, signal });
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;
        const blockLines = block.split("\n");
        let eventType = "message";
        let dataStr = "";

        for (const line of blockLines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6).trim();
          }
        }

        if (dataStr) {
          try {
            const parsed = JSON.parse(dataStr);
            onEvent(eventType, parsed);
          } catch (e) {
            onEvent(eventType, dataStr);
          }
        }
      }
    }
  },
  getConversations: () => request<Conversation[]>("/api/chat/conversations"),
  getMessages: (conversationId: string) =>
    request<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages`),

  // Finance
  getAccounts: () => request<FinanceAccount[]>("/api/finance/accounts"),
  getCategories: () => request<FinanceCategory[]>("/api/finance/categories"),
  getTransactions: (params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", params.limit.toString());
    if (params?.offset) q.set("offset", params.offset.toString());
    return request<{ total: number; items: FinanceTransaction[] }>(`/api/finance/transactions?${q}`);
  },
  createTransaction: (data: {
    account_id: string;
    category_id: string;
    amount: number;
    currency?: string;
    transaction_type?: string;
    transaction_date: string;
    payee: string;
    notes?: string;
  }) =>
    request<FinanceTransaction>("/api/finance/transactions", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/api/finance/transactions/${id}`, { method: "DELETE" }),
  getFinanceSummary: (month: number, year: number) =>
    request<FinanceSummary>(`/api/finance/summary?month=${month}&year=${year}`),

  // Coding
  getProjects: () => request<RegisteredProject[]>("/api/coding/projects"),
  registerProject: (data: { name: string; path: string; project_type?: string; description?: string }) =>
    request<any>("/api/coding/projects", { method: "POST", body: JSON.stringify(data) }),
  getGitStatus: (projectId: string) => request<GitStatus>(`/api/coding/projects/${projectId}/git-status`),
  getGitLog: (projectId: string) => request<{ commits: string[] }>(`/api/coding/projects/${projectId}/git-log`),
  getGitDiff: (projectId: string) => request<{ diff: string }>(`/api/coding/projects/${projectId}/git-diff`),

  // Productivity
  getTasks: (status?: string) =>
    request<TaskItem[]>(status ? `/api/productivity/tasks?status=${status}` : "/api/productivity/tasks"),
  createTask: (data: { title: string; description?: string; priority?: string; due_date?: string; project_id?: string }) =>
    request<TaskItem>("/api/productivity/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<TaskItem>) =>
    request<TaskItem>(`/api/productivity/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<{ message: string }>(`/api/productivity/tasks/${id}`, { method: "DELETE" }),
  getNotifications: () => request<NotificationItem[]>("/api/productivity/notifications"),
  markNotificationRead: (id: string) =>
    request<{ status: string }>(`/api/productivity/notifications/${id}/read`, { method: "PUT" }),

  // Gmail
  getGmailStatus: () => request<{ is_connected: boolean; account_email: string | null; status_message: string }>("/api/gmail/status"),
  disconnectGmail: () => request<{ message: string }>("/api/gmail/disconnect", { method: "POST" }),

  // Settings
  getGeminiSettings: () => request<{ is_configured: boolean; model_name: string; temperature: number }>("/api/settings/gemini"),
  updateGeminiSettings: (data: { api_key?: string; model_name?: string; temperature?: number }) =>
    request<{ message: string }>("/api/settings/gemini", { method: "POST", body: JSON.stringify(data) }),
  getAuditLogs: () => request<any[]>("/api/settings/audit-logs")
};
