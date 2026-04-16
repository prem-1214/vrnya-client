import React, { useEffect, useState } from "react";
import {
  HardDrive,
  FolderOpen,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  FileText,
  Folder,
  RefreshCcw,
  CloudUpload,
  X,
  Sparkles,
} from "lucide-react";
import {
  addAllowedIndexPath,
  indexAllPathsWithProgress,
  indexPathWithProgress,
  listAllowedIndexPaths,
  removeAllowedIndexPath,
} from "../api/client";
import type { AllowedIndexPath, IndexResponse } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadContext } from "../context/UploadContext";
import type { UploadItem } from "../hooks/useR2Upload";
import {
  canPickFilePath,
  canPickFolderPath,
  pickFilePath,
  pickFolderPath,
} from "../platform/shell";
import PageShell from "../components/layout/PageShell";

const ACCEPTED_TYPES = [
  "application/pdf",
  ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".docx",
  "text/plain",
  ".txt",
  "text/markdown",
  ".md",
  "text/csv",
  ".csv",
  "application/json",
  ".json",
  "text/html",
  ".html",
  "text/css",
  ".css",
  "text/javascript",
  "application/javascript",
  ".js",
  "application/x-yaml",
  "text/x-yaml",
  ".yaml",
  ".yml",
].join(",");

const STAGE_LABELS: Record<UploadItem["stage"], string> = {
  idle: "",
  validating: "Validating...",
  presigning: "Preparing...",
  uploading: "Uploading...",
  confirming: "Registering...",
  indexing: "Indexing...",
  done: "Indexed",
  error: "Failed",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const IndexPage: React.FC = () => {
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<
    "idle" | "indexing" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<IndexResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowedPaths, setAllowedPaths] = useState<AllowedIndexPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [isSavingPath, setIsSavingPath] = useState(false);
  const [isIndexingAll, setIsIndexingAll] = useState(false);
  const [activePath, setActivePath] = useState<string | null>(null);
  // Add to state declarations
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
    failed: number;
  } | null>(null);

  const {
    items: uploadItems,
    uploadMultiple,
    dismissItem,
    clearCompleted,
    hasCompleted,
  } = useUploadContext();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = React.useCallback(
    (files: FileList | File[]) => {
      if (files && files.length > 0) uploadMultiple(files);
    },
    [uploadMultiple],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0)
      handleFiles(e.target.files);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const resetFeedback = () => {
    setStatus("idle");
    setError(null);
    setResult(null);
  };

  const loadAllowedPaths = async () => {
    setIsLoadingPaths(true);
    try {
      const data = await listAllowedIndexPaths();
      setAllowedPaths(data.paths);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to load allowed paths"));
      setStatus("error");
    } finally {
      setIsLoadingPaths(false);
    }
  };

  useEffect(() => {
    void loadAllowedPaths();
  }, []);

  const handleBrowseFolder = async () => {
    const selectedPath = await pickFolderPath();
    if (selectedPath) {
      setPath(selectedPath);
    }
  };

  const handleBrowseFile = async () => {
    resetFeedback();

    try {
      const selectedPath = await pickFilePath();

      if (typeof selectedPath === "string" && selectedPath.trim()) {
        setPath(selectedPath);
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to open the file picker"));
      setStatus("error");
    }
  };

  const handleAddPath = async () => {
    if (!path.trim()) return;

    setIsSavingPath(true);
    resetFeedback();

    try {
      await addAllowedIndexPath(path.trim());
      setPath("");
      setStatus("success");
      await loadAllowedPaths();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to add allowed path"));
      setStatus("error");
    } finally {
      setIsSavingPath(false);
    }
  };

  const handleRemovePath = async (targetPath: string) => {
    setActivePath(targetPath);
    resetFeedback();

    try {
      await removeAllowedIndexPath(targetPath);
      await loadAllowedPaths();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to remove allowed path"));
      setStatus("error");
    } finally {
      setActivePath(null);
    }
  };

  const handleIndexPath = async (targetPath: string) => {
    if (!targetPath.trim()) return;

    setStatus("indexing");
    setError(null);
    setResult(null);
    setActivePath(targetPath);
    setProgress(null);

    try {
      await indexPathWithProgress(targetPath, (event) => {
        if (event.type === "progress" || event.type === "done") {
          setProgress({
            current: event.current,
            total: event.total,
            currentFile: event.currentFile,
            failed: event.failed,
          });
        }

        if (event.type === "result") {
          setResult(event as unknown as IndexResponse);
          setStatus("success");
        }

        if (event.type === "error" && event.message) {
          setError(event.message);
          setStatus("error");
        }
      });

      await loadAllowedPaths();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to index path"));
      setStatus("error");
    } finally {
      setActivePath(null);
      setProgress(null);
    }
  };

  const handleIndexAll = async () => {
    setStatus("indexing");
    setError(null);
    setResult(null);
    setIsIndexingAll(true);
    setProgress({
      current: 0,
      total: 1,
      currentFile: "Preparing indexing...",
      failed: 0,
    });

    try {
      await indexAllPathsWithProgress((event) => {
        if (event.type === "progress" || event.type === "done") {
          setProgress({
            current: event.current,
            total: event.total > 0 ? event.total : 1,
            currentFile: event.currentFile,
            failed: event.failed,
          });
        }

        if (event.type === "result") {
          setResult({
            indexedPaths: event.indexedPath,
            indexedFiles: event.indexedFiles,
            totalChunks: event.totalChunks,
            skippedFiles: event.skippedFiles,
          } as IndexResponse);
          setStatus("success");
        }

        if (event.type === "error" && event.message) {
          setError(event.message);
          setStatus("error");
        }
      });

      await loadAllowedPaths();
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to index allowed paths"));
      setStatus("error");
    } finally {
      setIsIndexingAll(false);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Not indexed yet";
    return new Date(value).toLocaleString();
  };

  return (
    <PageShell
      title="Knowledge Index"
      subtitle="Manage the exact paths this app is allowed to index."
      contentClassName={`flex min-h-full max-w-[960px] flex-col p-12 ${
        uploadItems.length === 0 ? "justify-center" : "gap-6"
      }`}
    >
      {/* === TEMPORARILY DISABLED FOR TWITTER ===
        <div className="index-card glass">
          <div className="card-header">
            <HardDrive size={24} className="accent-text" />
            <div>
              <h3>Allowed Paths</h3>
              <p>
                Add folders or files here first. Only paths in this list can be
                indexed.
              </p>
            </div>
          </div>

          <div className="index-input-group">
            <div className="input-with-button">
              <input
                type="text"
                placeholder="C:\\Users\\Documents\\Notes"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
              <button
                className="browse-btn"
                onClick={handleBrowseFolder}
                disabled={!canPickFolderPath()}
                title={
                  canPickFolderPath()
                    ? "Choose a folder"
                    : "Folder picker is available in the desktop app"
                }
              >
                <FolderOpen size={18} />
                <span>Folder</span>
              </button>
              <button
                className="browse-btn"
                onClick={handleBrowseFile}
                disabled={!canPickFilePath()}
                title={
                  canPickFilePath()
                    ? "Choose a file"
                    : "File picker is available in the desktop app"
                }
              >
                <FileText size={18} />
                <span>File</span>
              </button>
              <button
                className="r2-upload-trigger-btn"
                onClick={() => setShowUploadModal(true)}
                title="Upload file to cloud storage"
              >
                <CloudUpload size={16} />
                <span>Upload to Cloud</span>
              </button>
            </div>

            {(!canPickFolderPath() || !canPickFilePath()) && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                In the web app, paste a server-local file or folder path
                manually. Desktop keeps the native file pickers.
              </p>
            )}

            <div className="index-actions-row">
              {status === "indexing" && progress && (
                <div
                  className="index-progress glass"
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <span>
                      Indexing {progress.current} / {progress.total} files
                      {progress.failed > 0 && (
                        <span style={{ color: "#ff6b6b" }}>
                          {" "}
                          · {progress.failed} failed
                        </span>
                      )}
                    </span>
                    <span>
                      {Math.round((progress.current / progress.total) * 100)}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "3px",
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(progress.current / progress.total) * 100}%`,
                        background: "var(--color-accent, #6c63ff)",
                        borderRadius: "3px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: "0.5rem 0 0",
                      fontSize: "0.8rem",
                      color: "var(--color-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {progress.currentFile
                      ? progress.currentFile.split(/[/\\]/).pop()
                      : "Preparing indexing..."}
                  </p>
                </div>
              )}

              <button
                className={`secondary-btn ${path ? "active" : ""}`}
                onClick={handleAddPath}
                disabled={!path || isSavingPath}
              >
                {isSavingPath ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}
                <span>{isSavingPath ? "Adding..." : "Allow Path"}</span>
              </button>

              <button
                className={`index-btn ${allowedPaths.length ? "active" : ""}`}
                onClick={handleIndexAll}
                disabled={!allowedPaths.length || isIndexingAll}
              >
                {isIndexingAll ? (
                  <Loader2 className="spin" size={18} />
                ) : (
                  <RefreshCcw size={18} />
                )}
                <span>
                  {isIndexingAll ? "Indexing..." : "Index All Allowed Paths"}
                </span>
              </button>
            </div>
          </div>

          <div className="allowed-paths-section">
            <div className="allowed-paths-header">
              <h4>Configured Paths</h4>
              <span>{allowedPaths.length} total</span>
            </div>

            {isLoadingPaths ? (
              <div className="empty-state glass">
                <Loader2 className="spin" size={18} />
                <span>Loading allowed paths...</span>
              </div>
            ) : allowedPaths.length === 0 ? (
              <div className="empty-state glass">
                <AlertCircle size={18} />
                <span>No allowed paths yet. Add one to unlock indexing.</span>
              </div>
            ) : (
              <div className="allowed-path-list">
                <AnimatePresence>
                  {status === "success" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="status-box success glass"
                    >
                      <CheckCircle size={20} />
                      <div>
                        <h4>
                          {result ? "Indexing Complete" : "Allowed Path Saved"}
                        </h4>
                        <p>
                          {result
                            ? result.indexedFiles !== undefined
                              ? result.indexedPaths !== undefined
                                ? `Indexed ${result.indexedPaths} allowed paths, ${result.indexedFiles} files, and ${result.totalChunks} semantic chunks.${result.skippedFiles ? ` Skipped ${result.skippedFiles} files.` : ""}`
                                : `Indexed ${result.indexedFiles} files and created ${result.totalChunks} semantic chunks.${result.skippedFiles ? ` Skipped ${result.skippedFiles} files.` : ""}`
                              : result.unchanged
                                ? "No changes were detected since the last index."
                                : `Successfully indexed the file into ${result.chunks} chunks.`
                            : "The path was added to the allowed index list."}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {status === "error" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="status-box error glass"
                    >
                      <AlertCircle size={20} />
                      <div>
                        <h4>Indexing Failed</h4>
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {allowedPaths.map((entry) => {
                  const isIndexingEntry =
                    activePath === entry.path && status === "indexing";

                  return (
                    <div key={entry.path} className="allowed-path-item glass">
                      <div className="allowed-path-meta">
                        <div className="allowed-path-title">
                          {entry.kind === "directory" ? (
                            <Folder size={18} className="accent-text" />
                          ) : (
                            <FileText size={18} className="accent-text" />
                          )}
                          <div>
                            <strong>{entry.path.split(/[/\\]/).pop()}</strong>
                            <p>{entry.path}</p>
                          </div>
                        </div>
                        <div className="allowed-path-details">
                          <span className="path-kind">{entry.kind}</span>
                          <span>
                            Last indexed: {formatDate(entry.lastIndexedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="allowed-path-actions">
                        <button
                          className="secondary-btn compact active"
                          onClick={() => handleIndexPath(entry.path)}
                          disabled={status === "indexing"}
                        >
                          {isIndexingEntry ? (
                            <Loader2 className="spin" size={16} />
                          ) : (
                            <ArrowRight size={16} />
                          )}
                          <span>
                            {entry.lastIndexedAt ? "Re-index" : "Index"}
                          </span>
                        </button>

                        <button
                          className="danger-btn compact"
                          onClick={() => handleRemovePath(entry.path)}
                          disabled={status === "indexing"}
                        >
                          <Trash2 size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        */}

      {/* Polished Cloud Dropzone — always visible */}
      <button
        type="button"
        className={`relative mx-auto flex min-h-[400px] w-full max-w-[700px] cursor-pointer flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border-2 border-dashed border-(--color-accent) bg-(--panel-soft-bg) px-8 py-[60px] text-center transition-all duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,rgba(108,99,255,0.08)_0%,transparent_70%)] ${dragOver ? "translate-y-[-2px] border-(--color-accent-hover) shadow-[var(--shadow-lg),0_0_40px_rgba(108,99,255,0.15)]" : "hover:translate-y-[-2px] hover:border-(--color-accent-hover) hover:shadow-[var(--shadow-lg),0_0_40px_rgba(108,99,255,0.15)]"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload files to cloud vault"
      >
        <div className="relative z-10 mb-1 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-(--color-accent-subtle) shadow-[inset_0_0_20px_rgba(108,99,255,0.2),0_0_0_8px_rgba(108,99,255,0.05)] transition-transform duration-300">
          <CloudUpload size={54} className="text-(--color-accent)" />
        </div>
        <div className="relative z-10">
          <h3 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-(--color-text-primary)">
            Cloud Vault
          </h3>
          <p className="mx-auto max-w-[480px] text-base leading-relaxed text-(--color-text-secondary)">
            Drag &amp; drop files here to vault them, or click to browse.
          </p>
          <div className="mt-2 text-sm text-(--color-text-muted)">
            PDF, DOCX, TXT, MD, CSV, JSON, HTML — max 50MB per file
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-1.5 rounded-full border-0 bg-(--color-accent) px-9 py-4 text-base font-semibold text-white shadow-[0_4px_14px_rgba(108,99,255,0.4)]">
          <CloudUpload size={22} />
          <span>Select Files</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
      </button>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadItems.length > 0 && (
          <motion.div
            key="upload-queue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 flex flex-col gap-2.5"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-(--color-text-secondary)">
                Upload Queue ({uploadItems.length})
              </span>
              {hasCompleted && (
                <button
                  onClick={clearCompleted}
                  className="cursor-pointer rounded-[6px] border border-(--color-border) bg-transparent px-2.5 py-[3px] text-xs text-(--color-text-muted)"
                >
                  Clear Completed
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {uploadItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                  className={`flex flex-col gap-2 rounded-[10px] border border-(--glass-border) bg-(--glass-bg) px-3.5 py-3 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)] ${
                    item.stage === "error"
                      ? "border-l-[3px] border-l-(--color-error)"
                      : item.stage === "done"
                        ? "border-l-[3px] border-l-(--color-success)"
                        : "border-l-[3px] border-l-(--color-accent)"
                  }`}
                >
                  {/* Row 1: filename + badge + dismiss */}
                  <div className="flex items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">
                        {item.fileName}
                      </span>
                      {item.stage === "error" && item.error && (
                        <span className="text-[11px] text-(--color-error)">
                          {item.error}
                        </span>
                      )}
                    </div>
                    <span
                      className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ${
                        item.stage === "done"
                          ? "bg-[rgba(52,211,153,0.15)] text-(--color-success)"
                          : item.stage === "error"
                            ? "bg-[rgba(248,113,113,0.15)] text-(--color-error)"
                            : "bg-[rgba(108,99,255,0.15)] text-(--color-accent)"
                      }`}
                    >
                      {item.stage === "done" ? (
                        <CheckCircle2 size={10} />
                      ) : item.stage === "error" ? (
                        <AlertCircle size={10} />
                      ) : item.stage === "indexing" ? (
                        <Sparkles size={10} />
                      ) : (
                        <Loader2 size={10} className="animate-spin" />
                      )}
                      {STAGE_LABELS[item.stage]}
                    </span>
                    {(item.stage === "done" || item.stage === "error") && (
                      <button
                        onClick={() => dismissItem(item.id)}
                        title="Dismiss"
                        className="flex cursor-pointer items-center border-0 bg-transparent p-0.5 text-(--color-text-muted)"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Row 2: Progress bars */}
                  {item.stage === "uploading" && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-(--color-text-muted)">
                        <span>Upload</span>
                        <span>{item.uploadProgress}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-[2px] bg-(--color-border-subtle)">
                        <div
                          className="h-full bg-(--color-accent) transition-[width] duration-300 ease-in-out"
                          style={{ width: `${item.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {item.stage === "indexing" && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-(--color-text-muted)">
                        <span>Indexing</span>
                        <span>{item.indexProgress}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-[2px] bg-(--color-border-subtle)">
                        <div
                          className="h-full bg-violet-400 transition-[width] duration-500 ease-in-out"
                          style={{ width: `${item.indexProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="index-tips" />
    </PageShell>
  );
};

export default IndexPage;
