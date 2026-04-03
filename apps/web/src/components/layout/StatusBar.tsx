import React from "react";
import { useAppContext } from "../../context/AppContext";
import { Activity, Database, CheckCircle2, AlertCircle } from "lucide-react";

const StatusBar: React.FC = () => {
  const { isConnected, isDbConnected, theme, activeLlm } = useAppContext();

  return (
    <footer className="h-[30px] w-full flex items-center justify-between px-4 text-[10px] font-medium uppercase tracking-[0.05em] text-[--color-text-muted] border-t border-[--glass-border] bg-[--statusbar-bg] glass">
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-1 transition-all duration-300 ease-in-out ${
            isConnected ? "text-[--color-success]" : "text-[--color-error]"
          }`}
        >
          {isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>Server: {isConnected ? "Online" : "Disconnected"}</span>
        </div>
        <div className="w-[1px] h-[12px] bg-[--color-border]" />
        <div
          className={`flex items-center gap-1 transition-all duration-300 ease-in-out ${
            isDbConnected ? "text-[--color-success]" : "text-[--color-error]"
          }`}
        >
          <Database size={12} />
          <span>DB: {isDbConnected ? "Connected" : "Error"}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 transition-all duration-300 ease-in-out text-[--color-text-secondary]">
          <span>Theme: {theme}</span>
        </div>
        <div className="w-[1px] h-[12px] bg-[--color-border]" />
        <div className="flex items-center gap-1 transition-all duration-300 ease-in-out text-[--color-text-secondary]">
          <Activity size={12} />
          <span>{activeLlm}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
