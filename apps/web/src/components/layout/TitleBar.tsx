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

  const buttonBaseClass = "w-[44px] h-full flex items-center justify-center bg-transparent border-none transition-all duration-200 ease-in-out";
  const buttonHoverClass = "hover:bg-[--color-bg-hover] hover:text-[--color-text-primary]";
  const closeButtonHoverClass = "hover:bg-[--color-error] hover:text-white";

  return (
    <div className="h-[40px] w-full flex items-center justify-between px-4 z-[1000] border-b border-[--glass-border] bg-[--titlebar-bg] drag-region glass">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.05em] uppercase text-[--color-text-secondary]">
        <div className="w-2 h-2 bg-[--color-accent] rounded-full shadow-[0_0_8px_var(--color-accent)]" />
        <span>SecondBrain</span>
      </div>
      <div className="flex h-full no-drag">
        <button
          onClick={toggleTheme}
          className={`${buttonBaseClass} text-[--color-accent] ${buttonHoverClass}`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {showWindowControls && (
          <>
            <button onClick={minimizeWindow} className={`${buttonBaseClass} text-[--color-text-secondary] ${buttonHoverClass}`} title="Minimize">
              <Minus size={14} />
            </button>
            <button onClick={maximizeWindow} className={`${buttonBaseClass} text-[--color-text-secondary] ${buttonHoverClass}`} title="Maximize">
              <Square size={12} />
            </button>
            <button onClick={closeWindow} className={`${buttonBaseClass} text-[--color-text-secondary] ${closeButtonHoverClass}`} title="Close">
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
