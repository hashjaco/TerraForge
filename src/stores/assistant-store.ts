import { create } from "zustand";
import { aiChat, type ChatTurn, type LlmConfig } from "@/lib/tauri-bridge";

interface AssistantState {
  messages: ChatTurn[];
  pending: boolean;
  error: string | null;

  send: (config: LlmConfig, text: string) => Promise<void>;
  clear: () => void;
}

// Lives outside the panel so the conversation survives switching sidebar tabs.
export const useAssistantStore = create<AssistantState>((set, get) => ({
  messages: [],
  pending: false,
  error: null,

  send: async (config, text) => {
    const messages: ChatTurn[] = [...get().messages, { role: "user", content: text }];
    set({ messages, pending: true, error: null });
    try {
      const reply = await aiChat(config, messages);
      set({ messages: [...messages, { role: "assistant", content: reply }] });
    } catch (err) {
      // Tauri commands reject with the Rust Err(String).
      if (typeof err !== "string") throw err;
      set({ error: err });
    } finally {
      set({ pending: false });
    }
  },

  clear: () => set({ messages: [], error: null }),
}));
