import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useChatStore } from "../store/useChatStore";
import { useAgentStore } from "../store/useAgentStore";
import { CommandBar } from "../components/hud/CommandBar";
import { api } from "../api/client";

// Mock the API layer
vi.mock("../api/client", () => ({
  api: {
    streamChat: vi.fn(),
    getConversations: vi.fn().mockResolvedValue([]),
    getMessages: vi.fn().mockResolvedValue([]),
  },
}));

describe("Chat Streaming & Robot State Synchronization Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChatStore.setState({
      conversations: [],
      activeConversationId: null,
      messages: [],
      isSending: false,
      inputText: "",
      error: null,
      abortController: null,
      currentToolName: null,
    });
    useAgentStore.setState({
      robotState: "IDLE",
      currentAgent: "HadesCore",
      audioLevel: 0,
    });
  });

  it("transitions robot state to THINKING and initializes assistant message on sendMessage", async () => {
    let capturedCallback: ((type: string, data: any) => void) | null = null;

    vi.mocked(api.streamChat).mockImplementation(
      async (_content, _convId, onEvent, _signal) => {
        capturedCallback = onEvent;
        // Keep promise pending initially
        return new Promise(() => {});
      }
    );

    const promise = useChatStore.getState().sendMessage("Kiểm tra CPU máy tính");

    // Immediately after sendMessage
    expect(useChatStore.getState().isSending).toBe(true);
    expect(useAgentStore.getState().robotState).toBe("THINKING");
    expect(useChatStore.getState().messages).toHaveLength(2);
    expect(useChatStore.getState().messages[0].role).toBe("user");
    expect(useChatStore.getState().messages[0].content).toBe("Kiểm tra CPU máy tính");
    expect(useChatStore.getState().messages[1].role).toBe("assistant");
    expect(useChatStore.getState().messages[1].content).toBe("");

    // Simulate SSE "tool_start" event
    act(() => {
      if (capturedCallback) {
        capturedCallback("tool_start", { tool: "get_system_stats" });
      }
    });

    expect(useChatStore.getState().currentToolName).toBe("get_system_stats");
    expect(useAgentStore.getState().robotState).toBe("PROCESSING");

    // Simulate SSE "token" events
    act(() => {
      if (capturedCallback) {
        capturedCallback("token", { token: "CPU đang ở mức " });
        capturedCallback("token", { token: "25%." });
      }
    });

    expect(useAgentStore.getState().robotState).toBe("SPEAKING");
    expect(useChatStore.getState().messages[1].content).toBe("CPU đang ở mức 25%.");

    // Simulate SSE "done" event
    act(() => {
      if (capturedCallback) {
        capturedCallback("done", { conversation_id: "conv-123" });
      }
    });

    expect(useAgentStore.getState().robotState).toBe("SUCCESS");
    expect(useChatStore.getState().isSending).toBe(false);
    expect(useChatStore.getState().currentToolName).toBeNull();
  });

  it("handles cancelStreaming to abort controller and reset robot to IDLE", async () => {
    const mockAbort = vi.fn();
    const mockController = { abort: mockAbort, signal: {} as AbortSignal } as unknown as AbortController;

    useChatStore.setState({
      isSending: true,
      abortController: mockController,
      currentToolName: "long_running_tool",
    });
    useAgentStore.setState({ robotState: "PROCESSING" });

    act(() => {
      useChatStore.getState().cancelStreaming();
    });

    expect(mockAbort).toHaveBeenCalledTimes(1);
    expect(useChatStore.getState().isSending).toBe(false);
    expect(useChatStore.getState().currentToolName).toBeNull();
    expect(useAgentStore.getState().robotState).toBe("IDLE");
  });

  it("handles stream error event and sets robot to ERROR", async () => {
    vi.mocked(api.streamChat).mockImplementation(
      async (_content, _convId, onEvent, _signal) => {
        onEvent("error", { error: "Không tìm thấy Gemini API Key trong Windows Credential Vault." });
      }
    );

    await useChatStore.getState().sendMessage("Câu hỏi bất kỳ");

    expect(useChatStore.getState().error).toBe("Không tìm thấy Gemini API Key trong Windows Credential Vault.");
    expect(useAgentStore.getState().robotState).toBe("ERROR");
    expect(useChatStore.getState().isSending).toBe(false);
  });

  it("renders CommandBar with DỪNG button when isSending is true", () => {
    useChatStore.setState({
      isSending: true,
      inputText: "",
      currentToolName: "get_finance_summary",
    });

    render(<CommandBar />);

    expect(screen.getByText("DỪNG")).toBeInTheDocument();
    expect(screen.getByText("ĐANG THỰC THI CÔNG CỤ:")).toBeInTheDocument();
    expect(screen.getByText("get_finance_summary")).toBeInTheDocument();
  });

  it("allows typing and submitting via Enter in CommandBar", () => {
    const sendSpy = vi.spyOn(useChatStore.getState(), "sendMessage");

    render(<CommandBar />);

    const textarea = screen.getByPlaceholderText(/Nhập mệnh lệnh hoặc câu hỏi cho HADES/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "HADES, kiểm tra dự án GreenPhone" } });
    expect(useChatStore.getState().inputText).toBe("HADES, kiểm tra dự án GreenPhone");

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(sendSpy).toHaveBeenCalledWith("HADES, kiểm tra dự án GreenPhone");
  });
});
