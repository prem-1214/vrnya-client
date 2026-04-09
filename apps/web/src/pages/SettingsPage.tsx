import React, { useState, useEffect } from "react";
import { Save, Server, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { BASE_URL, tokenStore } from "../api/client";

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

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

  return (
    <div className="index-page">
      <header className="page-header glass">
        <div className="header-info">
          <h1>Settings</h1>
          <span>
            Configure AI models, API keys, and application preferences.
          </span>
        </div>
      </header>

      <div className="index-container">
        {isLoading ? (
          <div className="empty-state glass">
            <Loader2 className="animate-spin text-(--color-accent)" size={32} />
            <span className="font-medium">Loading settings...</span>
          </div>
        ) : (
          <div className="index-card glass">
            <div className="card-header">
              <Server size={24} className="accent-text" />
              <div>
                <h3>LLM Provider</h3>
                <p>
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
                  {/* <option value="groq">Groq (Cloud / Fast)</option> */}
                  {/* <option value="openrouter">OpenRouter (Any LLM)</option> */}
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
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
