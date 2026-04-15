import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ExternalLink, File, FolderOpen, Loader2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as docx from "docx-preview";
import {
  BASE_URL,
  getDocumentById,
  getR2DownloadUrl,
  readFile,
  searchFiles,
  tokenStore,
} from "../../api/client";
import type { AgentSource } from "../../hooks/useChat";
import {
  isDesktopShell,
  openPathInShell,
  showPathInFolder,
} from "../../platform/shell";

interface ChatPreviewPanelProps {
  target: AgentSource | { path: string } | null;
  onClose: () => void;
  width?: number;
}

interface ResolvedDocument {
  id: string;
  name: string;
  path: string;
  content: string;
  extension: string;
  storage_type?: "r2" | "local";
  r2_key?: string;
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

const DOCX_EXTENSIONS = new Set([".doc", ".docx"]);

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\//g, "\\").toLowerCase();
}

function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function isAgentSource(
  target: AgentSource | { path: string } | null,
): target is AgentSource {
  return Boolean(
    target &&
      ("id" in target ||
        "name" in target ||
        "similarity" in target ||
        "extension" in target ||
        "storage_type" in target),
  );
}

async function resolveDocumentId(target: AgentSource): Promise<string | null> {
  if (target.id) return target.id;

  const exactPath = normalizePath(target.path);
  const candidateQueries = Array.from(
    new Set([target.name, getFileName(target.path)].filter(Boolean) as string[]),
  );

  for (const query of candidateQueries) {
    try {
      const response = await searchFiles(query);
      const match = response.results.find(
        (result) => result.id && result.path && normalizePath(result.path) === exactPath,
      );
      if (match?.id) return match.id;
    } catch {
      // Fall back to plain file preview if document lookup fails.
    }
  }

  return null;
}

const ChatPreviewPanel: React.FC<ChatPreviewPanelProps> = ({ target, onClose, width }) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<ResolvedDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const path = target?.path ?? null;
  const source = isAgentSource(target) ? target : null;
  const extension = useMemo(() => {
    if (document?.extension) return document.extension.toLowerCase();
    if (source?.extension) return source.extension.toLowerCase();
    return path ? getExtension(path) : "";
  }, [document?.extension, path, source?.extension]);
  const fileName = useMemo(() => (path ? getFileName(path) : ""), [path]);
  const canPreviewAsText = extension ? TEXT_EXTENSIONS.has(extension) : true;
  const isMarkdown = MARKDOWN_EXTENSIONS.has(extension);
  const isPdf = extension === ".pdf";
  const isDocx = DOCX_EXTENSIONS.has(extension);
  const canUseNativeShell = isDesktopShell();

  useEffect(() => {
    if (!path) {
      setContent("");
      setDocument(null);
      setPdfUrl(null);
      setDocxBuffer(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setContent("");
      setDocument(null);
      setPdfUrl(null);
      setDocxBuffer(null);

      try {
        let resolvedDocument: ResolvedDocument | null = null;

        if (source) {
          const documentId = await resolveDocumentId(source);
          if (documentId) {
            const response = await getDocumentById(documentId);
            resolvedDocument = response.document as ResolvedDocument;
          }
        }

        if (!active) return;

        if (resolvedDocument) {
          setDocument(resolvedDocument);

          if (resolvedDocument.extension.toLowerCase() === ".pdf") {
            if (resolvedDocument.storage_type === "r2") {
              const { downloadUrl } = await getR2DownloadUrl(resolvedDocument.id);
              if (!active) return;
              setPdfUrl(downloadUrl);
            } else {
              const response = await fetch(
                `${BASE_URL}/api/v1/documents/${resolvedDocument.id}/stream`,
                {
                  credentials: "include",
                  headers: tokenStore.get()
                    ? { Authorization: `Bearer ${tokenStore.get()}` }
                    : undefined,
                },
              );
              if (!response.ok) {
                throw new Error("Failed to load document preview");
              }
              const blob = await response.blob();
              if (!active) return;
              setPdfUrl(URL.createObjectURL(blob));
            }
            return;
          }

          if (DOCX_EXTENSIONS.has(resolvedDocument.extension.toLowerCase())) {
            if (resolvedDocument.storage_type === "r2") {
              const { downloadUrl } = await getR2DownloadUrl(resolvedDocument.id);
              const res = await fetch(downloadUrl);
              const arrayBuffer = await res.arrayBuffer();
              if (!active) return;
              setDocxBuffer(arrayBuffer);
            } else {
              const response = await fetch(
                `${BASE_URL}/api/v1/documents/${resolvedDocument.id}/stream`,
                {
                  credentials: "include",
                  headers: tokenStore.get()
                    ? { Authorization: `Bearer ${tokenStore.get()}` }
                    : undefined,
                },
              );
              if (!response.ok) {
                throw new Error("Failed to load document preview");
              }
              const arrayBuffer = await response.arrayBuffer();
              if (!active) return;
              setDocxBuffer(arrayBuffer);
            }
            return;
          }

          setContent(resolvedDocument.content ?? "");
          return;
        }

        if (!canPreviewAsText || isPdf || isDocx) {
          return;
        }

        const response = await readFile(path);
        if (!active) return;
        setContent(response.content);
      } catch (error: unknown) {
        if (!active) return;
        setError(getErrorMessage(error, "Failed to load preview"));
        setContent("");
        setDocument(null);
        setPdfUrl(null);
        setDocxBuffer(null);
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
  }, [path, canPreviewAsText, isDocx, isPdf, source]);

  useEffect(() => {
    if (!docxBuffer || !docxContainerRef.current) return;

    docxContainerRef.current.innerHTML = "";
    void docx.renderAsync(docxBuffer, docxContainerRef.current, undefined, {
      className: "docx",
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      experimental: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
    });
  }, [docxBuffer]);

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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
      className={`glass flex min-w-0 flex-col overflow-hidden border-l border-(--glass-border) bg-(--color-bg-surface) transition-all duration-200 ${
        path ? "w-[min(40vw,520px)] min-w-80 opacity-100" : "w-0 min-w-0 opacity-0"
      }`}
      style={path && width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
    >
      <div className="flex items-start justify-between gap-4 border-b border-(--glass-border) px-6 py-4">
        <div className="flex min-w-0 items-start gap-2">
          <File size={16} />
          <div>
            <h3 className="m-0 text-sm">{path ? fileName : "Preview"}</h3>
            <span
              className="block max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--color-text-muted)"
              title={path || undefined}
            >
              {path || "Select a file from chat to preview it here."}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-sm border border-(--glass-border) bg-transparent p-1.5 text-(--color-text-secondary) transition-colors duration-150 hover:bg-(--panel-soft-bg)"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {path ? (
        <>
          <div className="flex gap-2 border-b border-(--glass-border) px-6 py-4">
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-(--glass-border) bg-transparent px-2.5 py-2 text-(--color-text-primary) transition-colors duration-150 hover:bg-(--panel-soft-bg) disabled:cursor-not-allowed disabled:opacity-50"
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
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-(--glass-border) bg-transparent px-2.5 py-2 text-(--color-text-primary) transition-colors duration-150 hover:bg-(--panel-soft-bg) disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-8 py-8 text-center text-(--color-text-muted)">
                <Loader2 size={22} className="animate-spin" />
                <p>Loading preview...</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-8 py-8 text-center text-(--color-error)">
                <AlertCircle size={22} />
                <p>{error}</p>
              </div>
            )}

            {!isLoading && !error && isPdf && path && (
              <iframe
                className="min-h-[420px] h-full w-full border-0 bg-white"
                src={pdfUrl ?? undefined}
                title="PDF Preview"
              />
            )}

            {!isLoading && !error && isDocx && (
              docxBuffer ? (
                <div
                  ref={docxContainerRef}
                  className="docx-rendered-container"
                />
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-8 py-8 text-center text-(--color-text-muted)">
                  <File size={22} />
                  <p>This DOCX file could not be rendered inline.</p>
                </div>
              )
            )}

            {!isLoading && !error && !canPreviewAsText && !isPdf && !isDocx && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-8 py-8 text-center text-(--color-text-muted)">
                <File size={22} />
                <p>This file type does not have an inline preview yet.</p>
              </div>
            )}

            {!isLoading && !error && canPreviewAsText && (
              isMarkdown ? (
                <div className="markdown-body p-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="m-0 whitespace-pre-wrap wrap-break-word p-6 font-mono text-sm text-(--color-text-primary)">
                  {content}
                </pre>
              )
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-8 py-8 text-center text-(--color-text-muted)">
          <File size={22} />
          <p>Open any chat result on the left to inspect it here.</p>
        </div>
      )}
    </aside>
  );
};

export default ChatPreviewPanel;
