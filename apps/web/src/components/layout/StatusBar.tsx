import React from "react";
import { useAppContext } from "../../context/AppContext";
import { Activity, Database, CheckCircle2, AlertCircle } from "lucide-react";

const StatusBar: React.FC = () => {
  const { isConnected, isDbConnected, theme, activeLlm } = useAppContext();

  return (
    <footer className="glass flex h-[30px] w-full items-center justify-between border-t border-[var(--glass-border)] bg-[var(--statusbar-bg)] px-4 text-[10px] font-medium uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-1 transition-all duration-300 ease-in-out ${
            isConnected ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
          }`}
        >
          {isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>Server: {isConnected ? "Online" : "Disconnected"}</span>
        </div>
        <div className="h-[12px] w-[1px] bg-[var(--color-border)]" />
        <div
          className={`flex items-center gap-1 transition-all duration-300 ease-in-out ${
            isDbConnected ? "text-[var(--color-success)]" : "text-[var(--color-error)]"
          }`}
        >
          <Database size={12} />
          <span>DB: {isDbConnected ? "Connected" : "Error"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)] transition-all duration-300 ease-in-out">
          <span>Theme: {theme}</span>
        </div>
        <div className="h-[12px] w-[1px] bg-[var(--color-border)]" />
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)] transition-all duration-300 ease-in-out">
          <Activity size={12} />
          <span>{activeLlm}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
