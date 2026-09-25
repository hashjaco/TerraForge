import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasLlmApiKey, type LlmConfig, type LlmProvider } from "@/lib/tauri-bridge";

export const LLM_PROVIDERS: { id: LlmProvider; label: string; console: string }[] = [
  { id: "anthropic", label: "Anthropic", console: "console.anthropic.com" },
  { id: "openai", label: "OpenAI", console: "platform.openai.com" },
  { id: "xai", label: "xAI (Grok)", console: "console.x.ai" },
];

interface LlmSettingsState {
  provider: LlmProvider;
  models: Record<LlmProvider, string>;
  hasKey: boolean;

  setProvider: (provider: LlmProvider) => void;
  setModel: (model: string) => void;
  refreshKeyStatus: () => Promise<void>;
}

// Provider and model choice persist in localStorage; API keys live only in the OS keychain.
export const useLlmSettingsStore = create<LlmSettingsState>()(
  persist(
    (set, get) => ({
      provider: "anthropic",
      models: { anthropic: "claude-opus-5", openai: "", xai: "" },
      hasKey: false,

      setProvider: (provider) => {
        set({ provider, hasKey: false });
        get().refreshKeyStatus();
      },
      setModel: (model) =>
        set((s) => ({ models: { ...s.models, [s.provider]: model } })),
      refreshKeyStatus: async () => {
        const provider = get().provider;
        const hasKey = await hasLlmApiKey(provider);
        if (get().provider === provider) set({ hasKey });
      },
    }),
    {
      name: "terraforge-llm-settings",
      partialize: (s) => ({ provider: s.provider, models: s.models }),
    },
  ),
);

export function useLlmConfig(): LlmConfig {
  const provider = useLlmSettingsStore((s) => s.provider);
  const model = useLlmSettingsStore((s) => s.models[s.provider]);
  const config = { provider, model };
  return config;
}
