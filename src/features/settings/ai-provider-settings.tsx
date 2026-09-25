import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearLlmApiKey, listLlmModels, setLlmApiKey } from "@/lib/tauri-bridge";
import { LLM_PROVIDERS, useLlmSettingsStore } from "@/stores/llm-settings-store";

// Tauri commands reject with the Rust Err(String).
function asMessage(err: unknown): string {
  if (typeof err !== "string") throw err;
  return err;
}

export function AiProviderSettings() {
  const { provider, models, hasKey, setProvider, setModel, refreshKeyStatus } = useLlmSettingsStore();
  const model = models[provider];
  const providerInfo = LLM_PROVIDERS.find((p) => p.id === provider)!;

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    setAvailableModels([]);
    if (!hasKey) return;
    let current = true;
    listLlmModels(provider)
      .then((list) => current && setAvailableModels(list))
      .catch((err) => current && setError(asMessage(err)));
    return () => {
      current = false;
    };
  }, [provider, hasKey]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(asMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await setLlmApiKey(provider, draft);
      setDraft("");
      await refreshKeyStatus();
    });
  };

  const handleRemove = () =>
    run(async () => {
      await clearLlmApiKey(provider);
      await refreshKeyStatus();
    });

  const handleProviderChange = (id: typeof provider) => {
    setDraft("");
    setError(null);
    setProvider(id);
  };

  const modelOptions = model && !availableModels.includes(model) ? [model, ...availableModels] : availableModels;

  return (
    <form className="p-3 space-y-3" onSubmit={handleSave}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          AI Provider
        </h3>
        <span className={`text-[10px] ${hasKey ? "text-green-400" : "text-text-muted"}`}>
          {hasKey ? "Key saved" : "No key"}
        </span>
      </div>

      <div role="radiogroup" aria-label="AI provider" className="grid grid-cols-3 gap-1.5">
        {LLM_PROVIDERS.map((p) => (
          <label
            key={p.id}
            className={`text-center px-2 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-primary-500 ${
              provider === p.id
                ? "border-primary-500 bg-primary-950/30 text-text-primary"
                : "border-border hover:border-border-active bg-surface-overlay text-text-secondary"
            }`}
          >
            <input
              type="radio"
              name="llm-provider"
              value={p.id}
              checked={provider === p.id}
              onChange={() => handleProviderChange(p.id)}
              className="sr-only"
            />
            {p.label}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <Input
          label={`${providerInfo.label} API key`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={hasKey ? "Enter a new key to replace" : `From ${providerInfo.console}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex gap-1.5">
          <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={busy || !draft.trim()}>
            {busy ? "Checking..." : "Save"}
          </Button>
          {hasKey && (
            <Button type="button" variant="danger" size="sm" onClick={handleRemove} disabled={busy}>
              Remove
            </Button>
          )}
        </div>
      </div>

      {hasKey && (
        <div className="space-y-1">
          <label htmlFor="llm-model" className="text-[11px] text-text-muted block">
            Model
          </label>
          <select
            id="llm-model"
            className="w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-sm text-text-primary outline-none focus:border-border-active"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {!model && <option value="">Choose a model</option>}
            {modelOptions.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-[11px] text-error">{error}</p>}

      <p className="text-[10px] text-text-muted">
        Keys are stored in your OS keychain. When you use the assistant, object
        names, design standards and check results are sent to the selected
        provider; geometry is not sent.
      </p>
    </form>
  );
}
