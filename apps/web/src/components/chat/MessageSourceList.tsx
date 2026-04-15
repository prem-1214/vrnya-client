import React from "react";
import { ExternalLink, File, FolderOpen } from "lucide-react";
import type { AgentSource } from "../../hooks/useChat";
import { showPathInFolder } from "../../platform/shell";

interface MessageSourceListProps {
  sources: AgentSource[];
  onOpenPreview: (source: AgentSource) => void;
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function getExtension(path: string): string {
  const name = getFileName(path);
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toUpperCase() : "FILE";
}

const MessageSourceList: React.FC<MessageSourceListProps> = ({
  sources,
  onOpenPreview,
}) => {
  if (sources.length === 0) return null;

  const handleShowInFolder = async (path: string) => {
    const error = await showPathInFolder(path);
    if (error) {
      console.error("Could not show in folder:", error);
    }
  };

  return (
    <div className="mt-2.5 flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.05em] text-(--color-text-muted) uppercase">
        Sources
      </span>
      <div className="flex flex-col gap-1">
        {sources.map((source) => {
          const name = source.name || getFileName(source.path);
          const ext = getExtension(source.path);
          const similarity =
            typeof source.similarity === "number"
              ? `${Math.round(source.similarity * 100)}%`
              : null;

          return (
            <div
              key={source.path}
              className="flex items-center gap-2 rounded-md border border-(--color-border) bg-(--panel-soft-bg) px-2 py-1.5 transition-colors duration-150 hover:border-(--glass-border)"
            >
              <div className="shrink-0 text-(--color-text-muted)">
                <File size={14} />
                <span className="block text-[9px] leading-none font-medium text-(--color-text-muted)">
                  {ext}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span
                  className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--color-text-primary)"
                  title={source.path}
                >
                  {name}
                </span>
                {similarity && (
                  <span className="shrink-0 text-[11px] text-(--color-text-muted)">
                    {similarity}
                  </span>
                )}
              </div>
              <div className="shrink-0 flex gap-0.5">
                <button
                  type="button"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:bg-(--panel-strong-bg) hover:text-(--color-text-primary)"
                  title="Preview"
                  onClick={() => onOpenPreview(source)}
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:bg-(--panel-strong-bg) hover:text-(--color-text-primary)"
                  title="Show in folder"
                  onClick={() => handleShowInFolder(source.path)}
                >
                  <FolderOpen size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageSourceList;
