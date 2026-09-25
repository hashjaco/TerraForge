import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { useAssistantStore } from "@/stores/assistant-store";
import { LLM_PROVIDERS, useLlmConfig, useLlmSettingsStore } from "@/stores/llm-settings-store";
import { useUIStore } from "@/stores/ui-store";

function SetupNotice({ needsKey }: { needsKey: boolean }) {
  const setRightSidebarTab = useUIStore((s) => s.setRightSidebarTab);

  return (
    <div className="px-3 pb-3 space-y-2 text-xs text-text-muted">
      <p>
        {needsKey
          ? "Add an LLM provider API key to get started with the assistant."
          : "Choose a model for your LLM provider to get started with the assistant."}
      </p>
      <Button variant="primary" size="sm" onClick={() => setRightSidebarTab("settings")}>
        Open Settings
      </Button>
      <details className="pt-1">
        <summary className="cursor-pointer select-none text-primary-400">Learn more</summary>
        <div className="mt-2 space-y-2">
          <p>
            The assistant answers questions about your project: why a check
            failed, what a design standard means, and which values to change.
            It reads your project but can't modify it.
          </p>
          <p>
            It works with your own API key from one of these providers:{" "}
            {LLM_PROVIDERS.map((p) => `${p.label} (${p.console})`).join(", ")}.
            Keys are stored in your OS keychain.
          </p>
          <p>
            Each question sends object names, design standards and current
            check results to the provider you choose. Geometry and survey
            points are never sent.
          </p>
        </div>
      </details>
    </div>
  );
}

export function AssistantPanel() {
  const { messages, pending, error, send, clear } = useAssistantStore();
  const config = useLlmConfig();
  const hasKey = useLlmSettingsStore((s) => s.hasKey);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const ready = hasKey && !!config.model;
  const providerLabel = LLM_PROVIDERS.find((p) => p.id === config.provider)?.label;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, error]);

  const submit = () => {
    const text = draft.trim();
    if (!text || pending || !ready) return;
    setDraft("");
    send(config, text);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          Assistant
        </h3>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clear} disabled={pending}>
            Clear
          </Button>
        )}
      </div>

      {!ready && <SetupNotice needsKey={!hasKey} />}

      <div className="flex-1 overflow-y-auto px-3 space-y-2">
        {ready && messages.length === 0 && (
          <p className="text-xs text-text-muted">
            Ask about your design: why a check failed, what a standard means,
            or what to change.
          </p>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`px-2.5 py-1.5 text-xs rounded-lg whitespace-pre-wrap ${
              m.role === "user"
                ? "ml-6 bg-primary-500/15 text-text-primary"
                : "mr-6 bg-surface-overlay text-text-secondary"
            }`}
          >
            {m.content}
          </p>
        ))}
        {pending && <p className="text-xs text-text-muted">Thinking...</p>}
        {error && <p className="text-[11px] text-error">{error}</p>}
        <div ref={endRef} />
      </div>

      <form className="p-3 space-y-2 shrink-0 border-t border-border" onSubmit={handleSubmit}>
        <fieldset disabled={!ready} className="space-y-2 disabled:opacity-50">
          <textarea
            rows={3}
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none focus:border-border-active transition-colors resize-none disabled:cursor-not-allowed"
            placeholder={
              ready
                ? "Ask about this project… (Enter to send, Shift+Enter for a new line)"
                : "Assistant is disabled until a provider is set up"
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="submit" variant="primary" size="sm" className="w-full" disabled={!ready || pending || !draft.trim()}>
            Send
          </Button>
        </fieldset>
        {ready && (
          <p className="text-[10px] text-text-muted">
            {providerLabel} · {config.model}
          </p>
        )}
      </form>
    </div>
  );
}
