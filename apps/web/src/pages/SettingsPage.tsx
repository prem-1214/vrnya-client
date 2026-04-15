import React, { useState, useEffect } from "react";
import { Save, Server, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { BASE_URL, tokenStore, listMemories, deleteMemory, clearAllMemories, type MemoryItem } from "../api/client";
import MemorySettingsSection from "../components/settings/MemorySettingsSection";
import MemoryList from "../components/settings/MemoryList";

const API_URL = `${BASE_URL}/api/v1`;

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
        
        if (data.enable_memory !== undefined) setEnableMemory(data.enable_memory === "true");
        if (data.enable_long_term_memory !== undefined) setEnableLongTermMemory(data.enable_long_term_memory === "true");
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
      alert("Failed to delete memory");
    }
  };

  const handleClearAllMemories = async () => {
    if (confirm("Are you sure you want to clear ALL memories? This cannot be undone.")) {
      try {
        setIsClearingMemories(true);
        await clearAllMemories();
        setMemories([]);
      } catch (error) {
        console.error("Failed to clear memories:", error);
        alert("Failed to clear memories");
      } finally {
        setIsClearingMemories(false);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="z-10 flex items-center justify-between border-b border-(--glass-border) bg-(--header-bg) px-8 py-4 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]">
        <div>
          <h1 className="text-md font-bold text-(--color-text-primary)">
            Settings
          </h1>
          <span className="text-xs text-(--color-text-muted)">
            Configure AI models, API keys, and application preferences.
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-12 overflow-y-auto p-12">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-(--color-border) bg-(--panel-soft-bg) p-6 text-(--color-text-secondary)">
            <Loader2 className="animate-spin text-(--color-accent)" size={32} />
            <span className="font-medium">Loading settings...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-8 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-12 shadow-(--shadow-md)">
            <div className="flex items-center gap-6">
              <Server size={24} className="text-(--color-accent)" />
              <div>
                <h3 className="text-lg text-(--color-text-primary)">LLM Provider</h3>
                <p className="text-sm text-(--color-text-secondary)">
                  Choose which AI brain powers your Second Brain experience.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8 mt-2">
              <div className="h-auto flex flex-col gap-2">
                <label className="block text-sm font-semibold text-(--color-text-primary) mb-4 pb-6">
                  Active Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full border border-(--color-border) text-(--color-text-primary) min-h-8 rounded-xl outline-none focus:border-(--color-accent) transition-colors text-sm font-medium cursor-pointer shadow-sm"
                >
                  <option value="ollama">Ollama (Local / Free)</option>
                  <option value="gemini">Google Gemini (Cloud)</option>
                  <option value="groq">Groq (Cloud)</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>

              {provider === "gemini" && (
                <ProviderSection title="Gemini" icon={Key}>
                  <InputField
                    label="API Key"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    helpText="Get your key from Google AI Studio. (Leave masked string if unchanged)"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    helpText="Get your key from Groq Console. (Leave masked string if unchanged)"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Chat Model"
                      value={ollamaChatModel}
                      onChange={(e) => setOllamaChatModel(e.target.value)}
                      className="font-mono"
                      helpText={
                        <>
                          E.g.{" "}
                          <code className="bg-(--inline-code-bg) px-1 rounded">
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
                          <code className="bg-(--inline-code-bg) px-1 rounded">
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

              <div className="mt-4 pt-6 border-t border-(--color-border-subtle) flex items-center justify-between">
                <div className="flex-1">
                  <AnimatePresence>
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`text-sm font-medium px-4 py-2 rounded-lg inline-flex items-center border ${
                          message.type === "success"
                            ? "bg-[rgba(52,211,153,0.1)] text-(--color-success) border-[rgba(52,211,153,0.2)]"
                            : "bg-[rgba(248,113,113,0.1)] text-(--color-error) border-[rgba(248,113,113,0.2)]"
                        }`}
                      >
                        {message.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-12 min-w-28 flex items-center justify-center gap-2 bg-[linear-gradient(135deg,var(--color-accent),var(--color-accent-hover))] hover:shadow-[0_4px_15px_rgba(37,99,235,0.3)] text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-8 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-12 shadow-(--shadow-md)">
              <MemorySettingsSection
                enableMemory={enableMemory}
                enableLongTermMemory={enableLongTermMemory}
                onToggleMemory={setEnableMemory}
                onToggleLongTermMemory={setEnableLongTermMemory}
                onClearAll={handleClearAllMemories}
                isClearing={isClearingMemories}
              />
            </div>

            <div className="flex flex-col gap-8 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-12 shadow-(--shadow-md)">
              <MemoryList
                memories={memories}
                isLoading={isMemoriesLoading}
                error={memoryError}
                onDeleteMemory={handleDeleteMemory}
              />
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
