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
  const buttonHoverClass = "hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]";
  const closeButtonHoverClass = "hover:bg-[var(--color-error)] hover:text-white";

  return (
    <div className="glass drag-region z-[1000] flex h-[40px] w-full items-center justify-between border-b border-[var(--glass-border)] bg-[var(--titlebar-bg)] px-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-secondary)]">
        <div className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
        <span>SecondBrain</span>
      </div>
      <div className="flex h-full no-drag">
        <button
          onClick={toggleTheme}
          className={`${buttonBaseClass} text-[var(--color-accent)] ${buttonHoverClass}`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        {showWindowControls && (
          <>
            <button onClick={minimizeWindow} className={`${buttonBaseClass} text-[var(--color-text-secondary)] ${buttonHoverClass}`} title="Minimize">
              <Minus size={14} />
            </button>
            <button onClick={maximizeWindow} className={`${buttonBaseClass} text-[var(--color-text-secondary)] ${buttonHoverClass}`} title="Maximize">
              <Square size={12} />
            </button>
            <button onClick={closeWindow} className={`${buttonBaseClass} text-[var(--color-text-secondary)] ${closeButtonHoverClass}`} title="Close">
              <X size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
