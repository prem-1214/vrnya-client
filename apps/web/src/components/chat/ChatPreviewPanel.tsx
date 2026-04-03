import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, File, FolderOpen, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BASE_URL, readFile } from "../../api/client";
import {
  isDesktopShell,
  openPathInShell,
  showPathInFolder,
} from "../../platform/shell";
import "./ChatPreviewPanel.css";

interface ChatPreviewPanelProps {
  path: string | null;
  onClose: () => void;
  width?: number;
}

function getExtension(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() || "";
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".json",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".html",
  ".css",
  ".scss",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".cs",
  ".go",
  ".rs",
  ".sql",
  ".yml",
  ".yaml",
  ".xml",
  ".env",
]);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const ChatPreviewPanel: React.FC<ChatPreviewPanelProps> = ({ path, onClose, width }) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extension = useMemo(() => (path ? getExtension(path) : ""), [path]);
  const fileName = useMemo(() => (path ? path.split(/[/\\]/).pop() || path : ""), [path]);
  const canPreviewAsText = extension ? TEXT_EXTENSIONS.has(extension) : true;
  const isMarkdown = MARKDOWN_EXTENSIONS.has(extension);
  const isPdf = extension === ".pdf";
  const canUseNativeShell = isDesktopShell();

  useEffect(() => {
    if (!path) {
      setContent("");
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!canPreviewAsText || isPdf) {
      setContent("");
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await readFile(path);
        if (!active) return;
        setContent(response.content);
      } catch (error: unknown) {
        if (!active) return;
        setError(getErrorMessage(error, "Failed to load preview"));
        setContent("");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [path, canPreviewAsText, isPdf]);

  const handleOpenInSystem = async () => {
    if (!path) return;
    const error = await openPathInShell(path);
    if (error) {
      setError(`Could not open file: ${error}`);
    }
  };

  const handleShowInFolder = async () => {
    if (!path) return;
    const error = await showPathInFolder(path);
    if (error) {
      setError(error);
    }
  };

  return (
    <aside 
      className={`chat-preview-panel glass ${path ? "open" : ""}`}
      style={path && width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
    >
      <div className="chat-preview-header">
        <div className="chat-preview-title">
          <File size={16} />
          <div>
            <h3>{path ? fileName : "Preview"}</h3>
            <span title={path || undefined}>{path || "Select a file from chat to preview it here."}</span>
          </div>
        </div>
        <button type="button" className="chat-preview-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      {path ? (
        <>
          <div className="chat-preview-actions">
            <button
              type="button"
              className="chat-preview-btn"
              onClick={handleOpenInSystem}
              disabled={!canUseNativeShell}
              title={
                canUseNativeShell
                  ? "Open this file with the operating system"
                  : "Available in the desktop app"
              }
            >
              <ExternalLink size={14} />
              Open In System
            </button>
            <button
              type="button"
              className="chat-preview-btn"
              onClick={handleShowInFolder}
              disabled={!canUseNativeShell}
              title={
                canUseNativeShell
                  ? "Show this file in its folder"
                  : "Available in the desktop app"
              }
            >
              <FolderOpen size={14} />
              Show In Folder
            </button>
          </div>

          <div className="chat-preview-body">
            {isLoading && (
              <div className="chat-preview-empty">
                <Loader2 size={22} className="spin" />
                <p>Loading preview...</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="chat-preview-empty error">
                <AlertCircle size={22} />
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !error && isPdf && path && (
              <iframe
                className="chat-preview-pdf"
                src={`${BASE_URL}/api/v1/filesystem/stream?path=${encodeURIComponent(path)}`}
                title="PDF Preview"
              />
            )}

            {!isLoading && !error && !canPreviewAsText && !isPdf && (
              <div className="chat-preview-empty">
                <File size={22} />
                <p>This file type does not have an inline preview yet.</p>
              </div>
            )}

            {!isLoading && !error && canPreviewAsText && (
              isMarkdown ? (
                <div className="chat-preview-markdown markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="chat-preview-text">{content}</pre>
              )
            )}
          </div>
        </>
      ) : (
        <div className="chat-preview-empty">
          <File size={22} />
          <p>Open any chat result on the left to inspect it here.</p>
        </div>
      )}
    </aside>
  );
};

export default ChatPreviewPanel;
