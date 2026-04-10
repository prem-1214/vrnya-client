import React from "react";
import { Brain, Trash2, Loader2, Info } from "lucide-react";

interface MemorySettingsSectionProps {
  enableMemory: boolean;
  enableLongTermMemory: boolean;
  onToggleMemory: (enabled: boolean) => void;
  onToggleLongTermMemory: (enabled: boolean) => void;
  onClearAll: () => Promise<void>;
  isClearing: boolean;
}

const Toggle: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  label: string;
}> = ({ enabled, onToggle, label }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm font-medium text-(--color-text-primary)">{label}</span>
    <button
      onClick={() => onToggle(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        enabled ? "bg-(--color-accent)" : "bg-(--color-border)"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const MemorySettingsSection: React.FC<MemorySettingsSectionProps> = ({
  enableMemory,
  enableLongTermMemory,
  onToggleMemory,
  onToggleLongTermMemory,
  onClearAll,
  isClearing,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4 p-5 rounded-2xl border border-(--color-border-subtle) bg-[rgba(255,255,255,0.02)]">
        <div className="p-3 rounded-xl bg-(--color-accent-subtle) text-(--color-accent)">
          <Brain size={24} />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <h3 className="text-base font-bold text-(--color-text-primary)">Memory</h3>
          <p className="text-sm text-(--color-text-muted) leading-relaxed">
            Vrnya can remember useful details across conversations, like your preferences, goals, and project context.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <Toggle
          label="Enable memory"
          enabled={enableMemory}
          onToggle={onToggleMemory}
        />
        <Toggle
          label="Enable long-term memory"
          enabled={enableLongTermMemory}
          onToggle={onToggleLongTermMemory}
        />
      </div>

      <div className="pt-4 border-t border-(--color-border-subtle)">
        <div className="flex flex-col gap-3">
          <button
            onClick={onClearAll}
            disabled={isClearing}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[rgba(239,68,68,0.2)] text-(--color-error) bg-[rgba(239,68,68,0.05)] hover:bg-[rgba(239,68,68,0.1)] transition-colors disabled:opacity-50 font-semibold text-sm"
          >
            {isClearing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Trash2 size={18} />
            )}
            Clear all memories
          </button>
          <div className="flex items-start gap-2 px-1">
            <Info size={14} className="text-(--color-text-muted) mt-0.5 shrink-0" />
            <p className="text-xs text-(--color-text-muted) font-medium">
              This removes saved long-term memories. Conversation history may remain unless deleted separately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemorySettingsSection;
