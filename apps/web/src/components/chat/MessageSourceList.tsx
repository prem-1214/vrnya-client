import React from "react";
import { ExternalLink, File, FolderOpen } from "lucide-react";
import "./SourceMessageList.css";
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
    <div className="message-sources">
      <span className="message-sources-label">Sources</span>
      <div className="message-sources-list">
        {sources.map((source) => {
          const name = source.name || getFileName(source.path);
          const ext = getExtension(source.path);
          const similarity =
            typeof source.similarity === "number"
              ? `${Math.round(source.similarity * 100)}%`
              : null;

          return (
            <div key={source.path} className="message-source-card">
              <div className="message-source-icon">
                <File size={14} />
                <span className="message-source-ext">{ext}</span>
              </div>
              <div className="message-source-info">
                <span className="message-source-name" title={source.path}>
                  {name}
                </span>
                {similarity && (
                  <span className="message-source-similarity">
                    {similarity}
                  </span>
                )}
              </div>
              <div className="message-source-actions">
                <button
                  type="button"
                  className="message-source-btn"
                  title="Preview"
                  onClick={() => onOpenPreview(source)}
                >
                  <ExternalLink size={12} />
                </button>
                <button
                  type="button"
                  className="message-source-btn"
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
