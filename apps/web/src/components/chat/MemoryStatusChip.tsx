import React from "react";
import { Brain } from "lucide-react";

interface MemoryStatusChipProps {
  enabled: boolean;
}

const MemoryStatusChip: React.FC<MemoryStatusChipProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-(--color-accent-subtle) border border-[rgba(90,169,255,0.2)] shadow-[0_2px_10px_rgba(59,130,246,0.1)]">
      <div className="relative">
        <Brain size={14} className="text-(--color-accent)" />
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-accent)">
        Memory Enabled
      </span>
    </div>
  );
};

export default MemoryStatusChip;
