import React from "react";
import { useAppContext } from "../../context/AppContext";
import { Activity, Database, CheckCircle2, AlertCircle } from "lucide-react";

const StatusBar: React.FC = () => {
  const { isConnected, isDbConnected, theme, activeLlm } = useAppContext();

  return (
    <footer className="status-bar glass">
      <div className="status-group">
        <div
          className={`status-indicator ${isConnected ? "online" : "offline"}`}
        >
          {isConnected ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>Server: {isConnected ? "Online" : "Disconnected"}</span>
        </div>
        <div className="status-separator" />
        <div
          className={`status-indicator ${isDbConnected ? "online" : "offline"}`}
        >
          <Database size={12} />
          <span>DB: {isDbConnected ? "Connected" : "Error"}</span>
        </div>
      </div>
      <div className="status-group">
        <div className="status-indicator model-info">
          <span>Theme: {theme}</span>
        </div>
        <div className="status-separator" />
        <div className="status-indicator model-info">
          <Activity size={12} />
          <span>{activeLlm}</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
