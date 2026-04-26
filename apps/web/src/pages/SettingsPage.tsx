import React, { useState, useEffect } from "react";
import { Save, Server, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import {
  BASE_URL,
  tokenStore,
  listMemories,
  deleteMemory,
  clearAllMemories,
  type MemoryItem,
} from "../api/client";
import { useModal } from "../context/ModalContext"; // ✅ NEW: Custom modal
import MemorySettingsSection from "../components/settings/MemorySettingsSection";
import MemoryList from "../components/settings/MemoryList";
import PageShell from "../components/layout/PageShell";

const API_URL = `${BASE_URL}/api/v1`;
const PROVIDER_OPTIONS = [
  {
    value: "ollama",
    label: "Ollama",
    subtitle: "Local / Free",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    subtitle: "Cloud",
  },
  {
    value: "groq",
    label: "Groq",
    subtitle: "Cloud",
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    subtitle: "Cloud Hub",
  },
] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helpText?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  helpText,
  className = "",
  ...props
}) => (
  <div className="flex flex-col gap-2">
    <label className="block text-sm font-semibold text-(--color-text-primary)">
      {label}
    </label>
    <input
      className={`min-h-8 w-full  border border-(--color-border) text-(--color-text-primary) px-4 py-3 rounded-xl outline-none focus:border-(--color-accent) transition-colors text-sm placeholder:text-(--color-text-muted) ${className}`}
      {...props}
    />
    {helpText && (
      <small className="block text-xs text-(--color-text-muted) mt-2 font-medium">
        {helpText}
      </small>
    )}
  </div>
);

interface ProviderSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

const ProviderSection: React.FC<ProviderSectionProps> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="flex flex-col gap-5 ">
    <h4 className="flex items-center gap-2 text-(--color-text-primary) font-bold text-base">
      <Icon size={18} className="text-(--color-accent)" />
      {title} Configuration
    </h4>
    {children}
  </div>
);

const SettingsPage: React.FC = () => {
  const { refreshConfig } = useAppContext();
  const { showError, showConfirm } = useModal(); // ✅ NEW: Use modal
  const [provider, setProvider] = useState("ollama");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");

  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash-lite");
  const [geminiEmbedModel, setGeminiEmbedModel] = useState(
    "gemini-embedding-001",
  );
  const [groqModel, setGroqModel] = useState("llama3-70b-8192");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState(
    "llama-3.3-70b-versatile",
  );
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaChatModel, setOllamaChatModel] = useState("llama3.2:3b");
  const [ollamaEmbedModel, setOllamaEmbedModel] = useState("nomic-embed-text");

  const [enableMemory, setEnableMemory] = useState(true);
  const [enableLongTermMemory, setEnableLongTermMemory] = useState(true);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isMemoriesLoading, setIsMemoriesLoading] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [isClearingMemories, setIsClearingMemories] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setIsMemoriesLoading(true);
      setMemoryError(null);
      const data = await listMemories();
      setMemories(data);
    } catch (error) {
      setMemoryError(getErrorMessage(error, "Failed to load memories."));
    } finally {
      setIsMemoriesLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/config`, {
        headers: {
          ...(tokenStore.get()
            ? { Authorization: `Bearer ${tokenStore.get()}` }
            : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
        if (data.groq_api_key) setGroqKey(data.groq_api_key);
        if (data.gemini_chat_model) setGeminiModel(data.gemini_chat_model);
        if (data.gemini_embed_model)
          setGeminiEmbedModel(data.gemini_embed_model);
        if (data.groq_chat_model) setGroqModel(data.groq_chat_model);
        if (data.openrouter_api_key) setOpenRouterKey(data.openrouter_api_key);
        if (data.openrouter_chat_model)
          setOpenRouterModel(data.openrouter_chat_model);
        if (data.ollama_url) setOllamaUrl(data.ollama_url);
        if (data.ollama_chat_model) setOllamaChatModel(data.ollama_chat_model);
        if (data.ollama_embed_model)
          setOllamaEmbedModel(data.ollama_embed_model);

        if (data.enable_memory !== undefined)
          setEnableMemory(data.enable_memory === "true");
        if (data.enable_long_term_memory !== undefined)
          setEnableLongTermMemory(data.enable_long_term_memory === "true");
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const updates = {
        llm_provider: provider,
        gemini_api_key: geminiKey,
        gemini_chat_model: geminiModel,
        gemini_embed_model: geminiEmbedModel,
        groq_api_key: groqKey,
        groq_chat_model: groqModel,
        openrouter_api_key: openRouterKey,
        openrouter_chat_model: openRouterModel,
        ollama_url: ollamaUrl,
        ollama_chat_model: ollamaChatModel,
        ollama_embed_model: ollamaEmbedModel,
        enable_memory: String(enableMemory),
        enable_long_term_memory: String(enableLongTermMemory),
      };

      const res = await fetch(`${API_URL}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenStore.get()
            ? { Authorization: `Bearer ${tokenStore.get()}` }
            : {}),
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully!" });
        // Reload to get properly masked keys from the server
        loadSettings();
        // Update the global status bar display
        refreshConfig();
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to save settings.",
        });
      }
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Network error while saving."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Failed to delete memory:", error);
      await showError("Failed to Delete", "Failed to delete memory"); // ✅ UPDATED
    }
  };

  const handleClearAllMemories = async () => {
    const confirmed = await showConfirm(
      "Confirm Clear",
      "Are you sure you want to clear ALL memories? This cannot be undone.",
    ); // ✅ UPDATED
    if (!confirmed) return;

    try {
      setIsClearingMemories(true);
      await clearAllMemories();
      setMemories([]);
    } catch (error) {
      console.error("Failed to clear memories:", error);
      await showError("Failed to Clear", "Failed to clear memories"); // ✅ UPDATED
    } finally {
      setIsClearingMemories(false);
    }
  };

  return (
    <PageShell
      title="Settings"
      subtitle="Configure AI models, API keys, and application preferences."
      contentClassName="max-w-[1200px] p-6 lg:p-8"
    >
      {isLoading ? (
        <div className="m-auto flex items-center gap-2 rounded-md border border-dashed border-(--color-border) bg-(--panel-soft-bg) p-6 text-(--color-text-secondary)">
          <Loader2 className="animate-spin text-(--color-accent)" size={32} />
          <span className="font-medium">Loading settings...</span>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="glass rounded-xl border border-(--glass-border) bg-(--color-bg-surface) p-5 shadow-(--shadow-md) lg:sticky lg:top-4 lg:h-fit">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-accent-subtle) text-(--color-accent)">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-(--color-text-primary)">
                  Provider
                </h3>
                <p className="text-xs text-(--color-text-muted)">
                  Choose your active AI backend
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-2">
              {PROVIDER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProvider(option.value)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                    provider === option.value
                      ? "border-(--color-accent) bg-(--color-accent-subtle) text-(--color-accent)"
                      : "border-(--color-border) bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
                  }`}
                >
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs opacity-80">{option.subtitle}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-(--color-border-subtle) pt-4">
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`mb-3 rounded-lg border px-3 py-2 text-sm font-medium ${
                      message.type === "success"
                        ? "border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.1)] text-(--color-success)"
                        : "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.1)] text-(--color-error)"
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] px-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] hover:shadow-[0_4px_15px_rgba(37,99,235,0.3)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col gap-6">
            <div className="glass rounded-xl border border-(--glass-border) bg-(--color-bg-surface) p-6 shadow-(--shadow-md) md:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-accent-subtle) text-(--color-accent)">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-(--color-text-primary)">
                    {PROVIDER_OPTIONS.find((p) => p.value === provider)?.label}{" "}
                    Settings
                  </h3>
                  <p className="text-sm text-(--color-text-secondary)">
                    Update credentials and model preferences for the active
                    provider.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {provider === "gemini" && (
                  <ProviderSection title="Gemini" icon={Key}>
                    <InputField
                      label="API Key"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      helpText="Get your key from Google AI Studio. Keep masked value if unchanged."
                    />
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <InputField
                        label="Chat Model"
                        value={geminiModel}
                        onChange={(e) => setGeminiModel(e.target.value)}
                      />
                      <InputField
                        label="Embedding Model"
                        value={geminiEmbedModel}
                        onChange={(e) => setGeminiEmbedModel(e.target.value)}
                      />
                    </div>
                  </ProviderSection>
                )}

                {provider === "groq" && (
                  <ProviderSection title="Groq" icon={Key}>
                    <InputField
                      label="API Key"
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      helpText="Get your key from Groq Console. Keep masked value if unchanged."
                    />
                    <InputField
                      label="Chat Model"
                      value={groqModel}
                      onChange={(e) => setGroqModel(e.target.value)}
                    />
                  </ProviderSection>
                )}

                {provider === "ollama" && (
                  <ProviderSection title="Ollama" icon={Server}>
                    <InputField
                      label="Ollama Server URL"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="font-mono"
                    />
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <InputField
                        label="Chat Model"
                        value={ollamaChatModel}
                        onChange={(e) => setOllamaChatModel(e.target.value)}
                        className="font-mono"
                        helpText={
                          <>
                            E.g.{" "}
                            <code className="rounded bg-(--inline-code-bg) px-1">
                              llama3.2:3b
                            </code>
                          </>
                        }
                      />
                      <InputField
                        label="Embedding Model"
                        value={ollamaEmbedModel}
                        onChange={(e) => setOllamaEmbedModel(e.target.value)}
                        className="font-mono"
                        helpText={
                          <>
                            E.g.{" "}
                            <code className="rounded bg-(--inline-code-bg) px-1">
                              nomic-embed-text
                            </code>
                          </>
                        }
                      />
                    </div>
                  </ProviderSection>
                )}

                {provider === "openrouter" && (
                  <ProviderSection title="OpenRouter" icon={Key}>
                    <InputField
                      label="API Key"
                      placeholder="sk-or-v1-..."
                      value={openRouterKey}
                      onChange={(e) => setOpenRouterKey(e.target.value)}
                      helpText="Get your key from openrouter.ai"
                    />
                    <InputField
                      label="Chat Model"
                      value={openRouterModel}
                      onChange={(e) => setOpenRouterModel(e.target.value)}
                    />
                  </ProviderSection>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="glass rounded-xl border border-(--glass-border) bg-(--color-bg-surface) p-6 shadow-(--shadow-md) md:p-8">
                <MemorySettingsSection
                  enableMemory={enableMemory}
                  enableLongTermMemory={enableLongTermMemory}
                  onToggleMemory={setEnableMemory}
                  onToggleLongTermMemory={setEnableLongTermMemory}
                  onClearAll={handleClearAllMemories}
                  isClearing={isClearingMemories}
                />
              </div>

              <div className="glass rounded-xl border border-(--glass-border) bg-(--color-bg-surface) p-6 shadow-(--shadow-md) md:p-8">
                <MemoryList
                  memories={memories}
                  isLoading={isMemoriesLoading}
                  error={memoryError}
                  onDeleteMemory={handleDeleteMemory}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
};

export default SettingsPage;
