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
import { useMotionSettings } from "../lib/motion";
import { useModal } from "../context/ModalContext"; // ✅ NEW: Custom modal

const UploadedFilesPanel: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexingIds, setIndexingIds] = useState<Set<string>>(new Set());
  const { itemTransition, fadeSlide } = useMotionSettings();
  const { showError, showConfirm } = useModal(); // ✅ NEW: Use modal

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
      await showError("Re-index Failed", message); // ✅ UPDATED
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
    const confirmed = await showConfirm(
      "Confirm Delete",
      "Are you sure you want to permanently delete this document and its indexed data? This cannot be undone.",
    ); // ✅ UPDATED
    if (!confirmed) {
      return;
    }

    try {
      await deleteUploadedFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete file";
      await showError("Delete Failed", message); // ✅ UPDATED
    }
  };

  const renderBadge = (file: UploadedFile) => {
    const isIndexing = indexingIds.has(file.id);
    const isImage = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".svg",
    ].includes(file.extension.toLowerCase());

    if (isIndexing) {
      return (
        <span className="flex items-center gap-1 rounded-xl border border-(--color-border) bg-(--color-bg-hover) px-2.5 py-1 text-[11px] font-semibold">
          <Loader2 size={12} className="animate-spin" /> Indexing...
        </span>
      );
    }

    // For images, check indexed_at (images don't have chunks)
    if (isImage) {
      if (file.indexed_at) {
        return (
          <span className="flex items-center gap-1 rounded-xl border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-500">
            <CheckCircle2 size={12} /> Indexed
          </span>
        );
      } else {
        return (
          <span className="flex items-center gap-1 rounded-xl border border-gray-400/20 bg-gray-400/10 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
            <HelpCircle size={12} /> Not Indexed
          </span>
        );
      }
    }

    // For documents, check chunk_count
    if (file.chunk_count > 0) {
      return (
        <span className="flex items-center gap-1 rounded-xl border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-500">
          <CheckCircle2 size={12} /> Indexed
        </span>
      );
    } else if (file.indexed_at) {
      return (
        <span className="flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500">
          <AlertTriangle size={12} /> Failed
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 rounded-xl border border-gray-400/20 bg-gray-400/10 px-2.5 py-1 text-[11px] font-semibold text-gray-400">
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex justify-end">
        <button
          className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) p-2 text-(--color-text-muted) shadow-(--shadow-sm) transition-all duration-300 hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          onClick={fetchFiles}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_120px_80px] px-4 pb-1 text-[10px] font-bold tracking-widest text-(--color-text-muted) uppercase">
        <span>Name</span>
        <span className="text-right">Index Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-(--glass-border) bg-(--color-bg-surface) shadow-(--shadow-md)">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-4 text-(--color-text-secondary)"
            >
              <Loader2
                size={32}
                className="animate-spin text-(--color-accent)"
              />
              <p>Loading uploaded files...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-4 text-(--color-text-secondary)"
            >
              <AlertCircle size={32} />
              <p>{error}</p>
              <button
                className="cursor-pointer rounded-md border-0 bg-(--color-error) px-6 py-2 text-white"
                onClick={fetchFiles}
              >
                Try Again
              </button>
            </motion.div>
          ) : files.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col items-center justify-center gap-4 text-(--color-text-muted)"
            >
              <p>No uploaded files found.</p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              {files.map((file, idx) => (
                <motion.div
                  key={file.id}
                  variants={fadeSlide(8)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={itemTransition(idx)}
                  className="grid cursor-pointer grid-cols-[minmax(0,1fr)_120px_80px] items-center border-b border-(--glass-border) bg-(--color-bg-surface) p-4 text-sm transition-colors duration-200 last:border-b-0 hover:bg-(--color-bg-hover)"
                  onClick={() => navigate(`/document/${file.id}`)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <File size={18} className="text-(--color-text-muted)" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="overflow-hidden text-ellipsis font-medium">
                        {file.name}
                      </span>
                      <span className="flex items-center gap-2 text-[11px] text-(--color-text-muted)">
                        {formatSize(file.size)} &bull;{" "}
                        {file.extension || "Unknown"}
                        {file.indexed_at &&
                          ` • ${new Date(file.indexed_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    {renderBadge(file)}
                  </div>

                  <div className="flex justify-end gap-2">
                    {(file.chunk_count === 0 || !file.indexed_at) && (
                      <button
                        className="cursor-pointer rounded border border-(--color-border) bg-transparent px-2 py-1 text-xs text-(--color-text-secondary)"
                        onClick={(e) => handleReindex(e, file.id)}
                        disabled={indexingIds.has(file.id)}
                      >
                        Re-index
                      </button>
                    )}
                    <button
                      className="flex cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 text-(--color-text-muted) transition-colors duration-200 hover:bg-(--color-bg-hover) hover:text-(--color-error)"
                      onClick={(e) => handleDelete(e, file.id)}
                      title="Delete Document"
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
