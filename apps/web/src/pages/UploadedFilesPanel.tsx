import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  File,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  listUploadedFiles,
  type UploadedFile,
  indexR2File,
  deleteUploadedFile,
} from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

const UploadedFilesPanel: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexingIds, setIndexingIds] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listUploadedFiles();
      setFiles(response.files);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load uploaded files";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleReindex = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setIndexingIds((prev) => new Set(prev).add(fileId));
    try {
      await indexR2File(fileId);
      // Wait a moment and then refresh to show new status
      setTimeout(() => {
        fetchFiles();
      }, 1000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to trigger re-index";
      alert(message);
    } finally {
      setIndexingIds((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this document and its indexed data? This cannot be undone.")) {
      return;
    }

    try {
      await deleteUploadedFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete file";
      alert(message);
    }
  };

  const renderBadge = (file: UploadedFile) => {
    const isIndexing = indexingIds.has(file.id);

    if (isIndexing) {
      return (
        <span className="index-badge">
          <Loader2 size={12} className="spin" /> Indexing...
        </span>
      );
    }

    if (file.chunk_count > 0) {
      return (
        <span className="index-badge indexed">
          <CheckCircle2 size={12} /> Indexed
        </span>
      );
    } else if (file.indexed_at) {
      return (
        <span className="index-badge failed">
          <AlertTriangle size={12} /> Failed
        </span>
      );
    } else {
      return (
        <span className="index-badge not-indexed">
          <HelpCircle size={12} /> Not Indexed
        </span>
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="uploaded-files-list">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "var(--space-md)",
        }}
      >
        <button
          className="refresh-btn"
          onClick={fetchFiles}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "spin" : ""} />
        </button>
      </div>

      <div className="files-grid-header" style={{ gridTemplateColumns: "1fr 120px 80px" }}>
        <span className="col-name">Name</span>
        <span className="col-status">Index Status</span>
        <span className="col-actions">Actions</span>
      </div>

      <div className="files-list">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="files-loading"
            >
              <Loader2 size={32} className="spin accent-text" />
              <p>Loading uploaded files...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="files-error"
            >
              <AlertCircle size={32} />
              <p>{error}</p>
              <button onClick={fetchFiles}>Try Again</button>
            </motion.div>
          ) : files.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="files-error"
              style={{ color: "var(--color-text-muted)" }}
            >
              <p>No uploaded files found.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="files-grid"
            >
              {files.map((file, idx) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="file-item selectable"
                  onClick={() => navigate(`/document/${file.id}`)}
                  style={{ gridTemplateColumns: "1fr 120px 80px", cursor: "pointer" }}
                >
                  <div
                    className="file-info col-name"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <File size={18} className="file-icon" />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                      <span className="file-meta">
                        {formatSize(file.size)} &bull; {file.extension || 'Unknown'}
                        {file.indexed_at && ` • ${new Date(file.indexed_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="col-status" style={{ display: "flex", alignItems: "center" }}>
                    {renderBadge(file)}
                  </div>

                    <div className="col-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      {(file.chunk_count === 0 || !file.indexed_at) && (
                        <button
                          className="ai-action-btn"
                          onClick={(e) => handleReindex(e, file.id)}
                          disabled={indexingIds.has(file.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                          }}
                        >
                          Re-index
                        </button>
                      )}
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDelete(e, file.id)}
                        title="Delete Document"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--color-text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "color 0.2s, background 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadedFilesPanel;
