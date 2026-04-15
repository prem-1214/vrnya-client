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
import { useR2Upload, type UploadItem } from "../hooks/useR2Upload";
import {
  canPickFilePath,
  canPickFolderPath,
  pickFilePath,
  pickFolderPath,
} from "../platform/shell";
import "./IndexPage.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
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

  const { items: uploadItems, uploadMultiple, dismissItem, clearCompleted, hasCompleted } = useR2Upload();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = React.useCallback(
    (files: FileList | File[]) => {
      if (files && files.length > 0) uploadMultiple(files);
    },
    [uploadMultiple],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
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
    <div className="index-page">
      <header className="page-header glass">
        <div className="header-info">
          <h1>Knowledge Index</h1>
          <span>Manage the exact paths this app is allowed to index.</span>
        </div>
      </header>

      <div className="index-container">
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
        <div
          className={`upload-dropzone glass ${dragOver ? "drag-active" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ cursor: "pointer" }}
        >
          <div className="dropzone-icon-container">
            <CloudUpload size={54} className="accent-text" />
          </div>
          <div className="dropzone-text">
            <h3>Cloud Vault</h3>
            <p>Drag &amp; drop files here to vault them, or click to browse.</p>
            <div style={{ marginTop: "8px", fontSize: "14px", color: "var(--color-text-muted)" }}>
              PDF, DOCX, TXT, MD, CSV, JSON, HTML — max 50MB per file
            </div>
          </div>
          <button className="r2-upload-trigger-btn large-btn" style={{ pointerEvents: "none" }}>
            <CloudUpload size={22} />
            <span>Select Files</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
        </div>

        {/* Upload Queue */}
        <AnimatePresence>
          {uploadItems.length > 0 && (
            <motion.div
              key="upload-queue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  Upload Queue ({uploadItems.length})
                </span>
                {hasCompleted && (
                  <button
                    onClick={clearCompleted}
                    style={{
                      fontSize: "12px",
                      background: "transparent",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-muted)",
                      borderRadius: "6px",
                      padding: "3px 10px",
                      cursor: "pointer",
                    }}
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
                    className="glass"
                    style={{
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      borderLeft: item.stage === "error" ? "3px solid var(--color-error, #f87171)" :
                                  item.stage === "done" ? "3px solid var(--color-success, #34d399)" :
                                  "3px solid var(--color-accent, #6c63ff)",
                    }}
                  >
                    {/* Row 1: filename + badge + dismiss */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 500, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {item.fileName}
                        </span>
                        {item.stage === "error" && item.error && (
                          <span style={{ fontSize: "11px", color: "var(--color-error, #f87171)" }}>{item.error}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                        background: item.stage === "done" ? "rgba(52, 211, 153, 0.15)" :
                                    item.stage === "error" ? "rgba(248, 113, 113, 0.15)" :
                                    "rgba(108, 99, 255, 0.15)",
                        color: item.stage === "done" ? "var(--color-success, #34d399)" :
                               item.stage === "error" ? "var(--color-error, #f87171)" :
                               "var(--color-accent, #6c63ff)",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        {item.stage === "done" ? <CheckCircle2 size={10} /> :
                         item.stage === "error" ? <AlertCircle size={10} /> :
                         item.stage === "indexing" ? <Sparkles size={10} /> :
                         <Loader2 size={10} className="spin" />}
                        {STAGE_LABELS[item.stage]}
                      </span>
                      {(item.stage === "done" || item.stage === "error") && (
                        <button
                          onClick={() => dismissItem(item.id)}
                          title="Dismiss"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-text-muted)",
                            cursor: "pointer",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Progress bars */}
                    {item.stage === "uploading" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                          <span>Upload</span>
                          <span>{item.uploadProgress}%</span>
                        </div>
                        <div style={{ height: "4px", background: "var(--color-border-subtle, rgba(255,255,255,0.08))", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${item.uploadProgress}%`, background: "var(--color-accent, #6c63ff)", transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                    )}
                    {item.stage === "indexing" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                          <span>Indexing</span>
                          <span>{item.indexProgress}%</span>
                        </div>
                        <div style={{ height: "4px", background: "var(--color-border-subtle, rgba(255,255,255,0.08))", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${item.indexProgress}%`, background: "#a78bfa", transition: "width 0.5s ease" }} />
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
      </div>
    </div>
  );
};

export default IndexPage;
