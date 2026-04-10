import React from "react";
import { Brain, Loader2, AlertCircle } from "lucide-react";
import { type MemoryItem } from "../../api/client";
import MemoryListItem from "./MemoryListItem";

interface MemoryListProps {
  memories: MemoryItem[];
  isLoading: boolean;
  error: string | null;
  onDeleteMemory: (id: string) => Promise<void>;
}

const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  isLoading,
  error,
  onDeleteMemory,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 glass rounded-2xl border border-(--color-border-subtle)">
        <Loader2 className="animate-spin text-(--color-accent)" size={32} />
        <span className="text-sm font-medium text-(--color-text-muted)">Loading memories...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 glass rounded-2xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.02)]">
        <AlertCircle className="text-(--color-error)" size={32} />
        <div className="text-center">
          <h4 className="text-sm font-bold text-(--color-text-primary)">Failed to load memories</h4>
          <p className="text-xs text-(--color-text-muted) mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center glass rounded-2xl border border-(--color-border-subtle) bg-[rgba(255,255,255,0.01)]">
        <div className="w-16 h-16 rounded-2xl bg-(--color-bg-hover) flex items-center justify-center mb-6 text-(--color-text-muted)">
          <Brain size={32} strokeWidth={1.5} />
        </div>
        <h4 className="text-base font-bold text-(--color-text-primary)">No saved memories yet</h4>
        <p className="max-w-xs text-sm text-(--color-text-muted) mt-2 leading-relaxed font-medium">
          As you use Vrnya, helpful long-term details like preferences and project context can appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-bold text-(--color-text-primary) flex items-center gap-2">
          Saved Details
          <span className="px-2 py-0.5 rounded-full bg-(--color-bg-hover) text-[10px] font-bold text-(--color-text-secondary)">
            {memories.length}
          </span>
        </h4>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {memories.map((memory) => (
          <MemoryListItem
            key={memory.id}
            memory={memory}
            onDelete={onDeleteMemory}
          />
        ))}
      </div>
    </div>
  );
};

export default MemoryList;
