import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { healthCheck, getConfig } from "../api/client";
import { useAuth } from "./AuthContext";

type ThemeMode = "dark" | "light";

interface AppContextType {
  isConnected: boolean;
  isDbConnected: boolean;
  checkConnection: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  activeLlm: string;
  refreshConfig: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const THEME_STORAGE_KEY = "secondbrain-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "light";
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [activeLlm, setActiveLlm] = useState<string>("Loading...");

  const checkConnection = async () => {
    try {
      const data = await healthCheck();
      setIsConnected(data.status === "ok");
      setIsDbConnected(data.db === "connected");
    } catch (error) {
      setIsConnected(false);
      setIsDbConnected(false);
    }
  };

  const refreshConfig = async () => {
    try {
      const config = await getConfig();
      const provider = config.llm_provider || "ollama";
      let model = "unknown";

      if (provider === "ollama") model = config.ollama_chat_model || "unknown";
      else if (provider === "gemini")
        model = config.gemini_chat_model || "unknown";
      else if (provider === "groq") model = config.groq_chat_model || "unknown";
      else if (provider === "openrouter")
        model = config.openrouter_chat_model || "unknown";

      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      setActiveLlm(`${providerName}: ${model}`);
    } catch (error) {
      setActiveLlm("Config Error");
    }
  };

  const { isAuthLoading } = useAuth();

  useEffect(() => {
    checkConnection();
    if (isAuthLoading) {
      refreshConfig();
    }
    const interval = setInterval(checkConnection, 10000); // 10s polling
    return () => clearInterval(interval);
  }, [isAuthLoading]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <AppContext.Provider
      value={{
        isConnected,
        isDbConnected,
        checkConnection,
        isLoading,
        setIsLoading,
        theme,
        toggleTheme,
        activeLlm,
        refreshConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};
