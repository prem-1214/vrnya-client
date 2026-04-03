import React from "react";
import { X, Minus, Square, Moon, Sun } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import {
  canUseWindowControls,
  closeWindow,
  maximizeWindow,
  minimizeWindow,
} from "../../platform/shell";

const TitleBar: React.FC = () => {
  const { theme, toggleTheme } = useAppContext();
  const showWindowControls = canUseWindowControls();

  return (
    <div className="titlebar drag-region glass">
      <div className="titlebar-logo">
        <div className="logo-dot" />
        <span>SecondBrain</span>
      </div>
      <div className="titlebar-controls no-drag">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {showWindowControls && (
          <>
            <button onClick={minimizeWindow} title="Minimize">
              <Minus size={14} />
            </button>
            <button onClick={maximizeWindow} title="Maximize">
              <Square size={12} />
            </button>
            <button onClick={closeWindow} className="close-btn" title="Close">
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
