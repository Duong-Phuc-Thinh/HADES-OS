import { create } from "zustand";
import { ChatMessage, Conversation } from "../types";
import { api } from "../api/client";
import { useAgentStore } from "./useAgentStore";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isSending: boolean;
  inputText: string;
  error: string | null;
  abortController: AbortController | null;
  currentToolName: string | null;

  setInputText: (text: string) => void;
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  cancelStreaming: () => void;
  clearActiveConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isSending: false,
  inputText: "",
  error: null,
  abortController: null,
  currentToolName: null,

  setInputText: (text) => set({ inputText: text }),

  loadConversations: async () => {
    try {
      const convs = await api.getConversations();
      set({ conversations: convs });
      if (convs.length > 0 && !get().activeConversationId) {
        await get().selectConversation(convs[0].id);
      }
    } catch (e: any) {
      console.warn("Lỗi khi tải lịch sử hội thoại:", e.message);
    }
  },

  selectConversation: async (id: string) => {
    try {
      set({ activeConversationId: id, isSending: false });
      const msgs = await api.getMessages(id);
      set({ messages: msgs });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  sendMessage: async (content: string) => {
    if (!content.trim() || get().isSending) return;

    const agentStore = useAgentStore.getState();
    // 1. Initial State -> THINKING
    agentStore.setRobotState("THINKING");

    const tempUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    const tempAssistantId = `assistant-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
      agent_name: "HADES",
      created_at: new Date().toISOString()
    };

    const controller = new AbortController();

    set((state) => ({
      messages: [...state.messages, tempUserMsg, initialAssistantMsg],
      inputText: "",
      isSending: true,
      error: null,
      abortController: controller,
      currentToolName: null
    }));

    try {
      const convId = get().activeConversationId || undefined;

      await api.streamChat(
        content.trim(),
        convId,
        (eventType, data) => {
          if (eventType === "start") {
            if (data.agent_name) agentStore.setCurrentAgent(data.agent_name);
            if (data.conversation_id) set({ activeConversationId: data.conversation_id });
            agentStore.setRobotState("THINKING");
          } else if (eventType === "tool_start") {
            set({ currentToolName: data.tool });
            // Tool call starting -> PROCESSING
            agentStore.setRobotState("PROCESSING");
          } else if (eventType === "tool_result") {
            // Tool completed -> Still PROCESSING before generating answer
            agentStore.setRobotState("PROCESSING");
          } else if (eventType === "token") {
            // Streaming tokens -> SPEAKING
            agentStore.setRobotState("SPEAKING");
            set((state) => {
              const msgs = [...state.messages];
              const last = msgs[msgs.length - 1];
              if (last && last.id === tempAssistantId) {
                last.content += data.token || "";
              }
              return { messages: msgs };
            });
          } else if (eventType === "done") {
            // Completed -> SUCCESS
            agentStore.setRobotState("SUCCESS");
            set({ isSending: false, abortController: null, currentToolName: null });
            setTimeout(() => {
              if (useAgentStore.getState().robotState === "SUCCESS") {
                useAgentStore.getState().setRobotState("IDLE");
              }
            }, 2500);
            get().loadConversations();
          } else if (eventType === "error") {
            // Failure -> ERROR
            agentStore.setRobotState("ERROR");
            set({ error: data.error, isSending: false, abortController: null, currentToolName: null });
            setTimeout(() => {
              if (useAgentStore.getState().robotState === "ERROR") {
                useAgentStore.getState().setRobotState("IDLE");
              }
            }, 3000);
          }
        },
        controller.signal
      );
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Người dùng đã hủy phản hồi streaming.");
      } else {
        set({ error: e.message });
        agentStore.setRobotState("ERROR");
        setTimeout(() => agentStore.setRobotState("IDLE"), 3000);
      }
      set({ isSending: false, abortController: null, currentToolName: null });
    }
  },

  cancelStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    useAgentStore.getState().setRobotState("IDLE");
    set({
      isSending: false,
      abortController: null,
      currentToolName: null
    });
  },

  clearActiveConversation: () => {
    set({
      activeConversationId: null,
      messages: [],
      error: null
    });
  }
}));
