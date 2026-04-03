import React, { useState, useEffect } from "react";
import { Save, Server, Loader2, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { BASE_URL } from "../api/client";

const API_URL = `${BASE_URL}/api/v1`;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const SettingsPage: React.FC = () => {
  const { refreshConfig } = useAppContext();
  const [provider, setProvider] = useState("ollama");
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");

  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [geminiEmbedModel, setGeminiEmbedModel] = useState("gemini-embedding-001");
  const [groqModel, setGroqModel] = useState("llama3-70b-8192");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModel, setOpenRouterModel] = useState(
    "llama-3.3-70b-versatile",
  );
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaChatModel, setOllamaChatModel] = useState("llama3.2");
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
      const res = await fetch(`${API_URL}/config`);
      if (res.ok) {
        const data = await res.json();
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.gemini_api_key) setGeminiKey(data.gemini_api_key);
        if (data.groq_api_key) setGroqKey(data.groq_api_key);
        if (data.gemini_chat_model) setGeminiModel(data.gemini_chat_model);
        if (data.gemini_embed_model) setGeminiEmbedModel(data.gemini_embed_model);
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
        headers: { "Content-Type": "application/json" },
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
            <Loader2 className="spin" size={24} />
            <span>Loading settings...</span>
          </div>
        ) : (
          <div className="index-card glass">
            <div className="card-header">
              <Server size={24} className="accent-text" />
              <div>
                <h3>LLM Provider</h3>
                <p>
                  Choose which AI brain powers your SecondBrain application.
                </p>
              </div>
            </div>

            <div style={{ padding: "1rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  Active Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.2)",
                    color: "white",
                  }}
                >
                  <option
                    value="ollama"
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    Ollama (Local / Free)
                  </option>
                  <option
                    value="gemini"
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    Google Gemini (Cloud)
                  </option>
                  <option
                    value="groq"
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    Groq (Cloud / Fast)
                  </option>
                  <option
                    value="openrouter"
                    style={{ background: "#1a1a2e", color: "white" }}
                  >
                    OpenRouter (Any LLM)
                  </option>
                </select>
              </div>

              {provider === "gemini" && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Key size={16} /> Gemini Configuration
                  </h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      API Key
                    </label>
                    <input
                      type="text"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                    <small style={{ color: "rgba(255,255,255,0.5)" }}>
                      Get your key from Google AI Studio. (Leave masked string
                      if unchanged)
                    </small>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Chat Model
                    </label>
                    <input
                      type="text"
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Embedding Model
                    </label>
                    <input
                      type="text"
                      value={geminiEmbedModel}
                      onChange={(e) => setGeminiEmbedModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
              )}

              {provider === "groq" && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Key size={16} /> Groq Configuration
                  </h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      API Key
                    </label>
                    <input
                      type="text"
                      placeholder="gsk_..."
                      value={groqKey}
                      onChange={(e) => setGroqKey(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                    <small style={{ color: "rgba(255,255,255,0.5)" }}>
                      Get your key from Groq Console. (Leave masked string if
                      unchanged)
                    </small>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Chat Model
                    </label>
                    <input
                      type="text"
                      value={groqModel}
                      onChange={(e) => setGroqModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
              )}

              {provider === "ollama" && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Server size={16} /> Ollama Configuration
                  </h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Ollama Server URL
                    </label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Chat Model
                    </label>
                    <input
                      type="text"
                      value={ollamaChatModel}
                      onChange={(e) => setOllamaChatModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                    <small style={{ color: "rgba(255,255,255,0.5)" }}>
                      Example: `llama3.2`, `qwen2.5`, or any local Ollama chat
                      model you have pulled.
                    </small>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Embedding Model
                    </label>
                    <input
                      type="text"
                      value={ollamaEmbedModel}
                      onChange={(e) => setOllamaEmbedModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                    <small style={{ color: "rgba(255,255,255,0.5)" }}>
                      Example: `nomic-embed-text` or another embedding model
                      available in your Ollama instance.
                    </small>
                  </div>
                </div>
              )}

              {provider === "openrouter" && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                  }}
                >
                  <h4
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Key size={16} /> OpenRouter Configuration
                  </h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      API Key
                    </label>
                    <input
                      type="text"
                      placeholder="sk-or-v1-..."
                      value={openRouterKey}
                      onChange={(e) => setOpenRouterKey(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                    <small style={{ color: "rgba(255,255,255,0.5)" }}>
                      Get your key from openrouter.ai. (Leave masked string if
                      unchanged)
                    </small>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      Chat Model
                    </label>
                    <input
                      type="text"
                      value={openRouterModel}
                      onChange={(e) => setOpenRouterModel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.6rem",
                        borderRadius: "6px",
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    />
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: "2rem",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="index-btn active"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isSaving ? (
                    <Loader2 className="spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{isSaving ? "Saving..." : "Save Settings"}</span>
                </button>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`status-box ${message.type === "success" ? "success" : "error"} glass`}
                    style={{ marginTop: "1.5rem" }}
                  >
                    <span>{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
