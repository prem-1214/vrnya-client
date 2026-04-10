import React from "react";
import { Trash2, Clock } from "lucide-react";
import type { MemoryItem, MemoryType } from "../../api/client";

interface MemoryListItemProps {
  memory: MemoryItem;
  onDelete: (id: string) => Promise<void>;
}

const getTypeColor = (type: MemoryType) => {
  switch (type) {
    case "user_profile":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "user_preference":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "project_context":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "working_goal":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "important_decision":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  }
};

const formatTypeLabel = (type: string) => {
  return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const MemoryListItem: React.FC<MemoryListItemProps> = ({ memory, onDelete }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (confirm("Delete this memory?")) {
      setIsDeleting(true);
      try {
        await onDelete(memory.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const relativeTime = new Date(memory.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative flex items-center gap-4 p-4 rounded-xl border border-(--color-border-subtle) hover:bg-(--color-bg-hover) transition-all duration-200">
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getTypeColor(memory.memory_type)}`}>
            {formatTypeLabel(memory.memory_type)}
          </span>
          <span className="text-[11px] font-semibold text-(--color-text-muted) truncate">
            {memory.memory_key}
          </span>
        </div>
        
        <p className="text-sm text-(--color-text-primary) font-medium leading-normal">
          {memory.memory_value}
        </p>
        
        <div className="flex items-center gap-1.5 text-(--color-text-muted)">
          <Clock size={12} />
          <span className="text-[11px] font-medium">{relativeTime}</span>
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-(--color-text-muted) hover:text-(--color-error) hover:bg-[rgba(239,68,68,0.1)] transition-all disabled:opacity-50"
        title="Delete memory"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default MemoryListItem;
