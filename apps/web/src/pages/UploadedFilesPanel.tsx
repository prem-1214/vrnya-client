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
  ChevronRight,
  Folder,
  FolderOpen,
  Upload,
  Plus,
} from "lucide-react";
import {
  listUploadedFiles,
  type UploadedFile,
  indexR2File,
  deleteUploadedFile,
  getUserFolders,
  createFolder,
} from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "../context/ModalContext"; // ✅ NEW: Custom modal
import { useUploadContext } from "../context/UploadContext";
import R2UploadModal from "../components/upload/R2UploadModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import { buildFileTree, type FileTreeNode as TreeNode } from "../components/sidebar/fileTree";

const UploadedFilesPanel: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [indexingIds, setIndexingIds] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [folders, setFolders] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const { showAlert, showError, showConfirm } = useModal(); // ✅ NEW: Use modal
  const { setTargetFolder } = useUploadContext();

  const navigate = useNavigate();

  const handleUploadFolder = (folderPath: string) => {
    setTargetFolder(folderPath);
    setShowUploadModal(true);
  };

  const handleUploadDefault = () => {
    setTargetFolder(null);
    setShowUploadModal(true);
  };

  const isImageFile = (extension: string): boolean => {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".svg",
    ];
    return imageExtensions.includes(extension.toLowerCase());
  };

  const handleFileClick = (file: UploadedFile) => {
    if (isImageFile(file.extension)) {
      setPreviewFileId(file.id);
      setPreviewFileName(file.name);
      setShowImagePreview(true);
    } else {
      navigate(`/document/${file.id}`);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showError("Invalid Name", "Folder name cannot be empty");
      return;
    }

    // Validate folder name (no special characters)
    if (!/^[a-zA-Z0-9._\-]+$/.test(newFolderName.trim())) {
      showError(
        "Invalid Name",
        "Folder name can only contain letters, numbers, dots, dashes, and underscores",
      );
      return;
    }

    setIsCreatingFolder(true);
    try {
      const folderPath = newFolderParent
        ? `${newFolderParent}/${newFolderName}`
        : newFolderName;

      // Call API to create folder (persists to DB)
      await createFolder(folderPath);

      // Add to local expanded folders
      setExpandedFolders((prev) => new Set(prev).add(folderPath));

      // Refresh folders from backend
      const foldersResponse = await getUserFolders();
      setFolders(foldersResponse.folders);

      // Visual feedback
      showAlert("Folder created", `Folder "${folderPath}" was created.`);

      // Close modal and reset
      setShowNewFolderModal(false);
      setNewFolderName("");
      setNewFolderParent("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create folder";
      showError("Error", message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [filesResponse, foldersResponse] = await Promise.all([
        listUploadedFiles(),
        getUserFolders().catch(() => ({ folders: [] })),
      ]);
      setFiles(filesResponse.files);
      setFolders(foldersResponse.folders || []);
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

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    if (node.type === "folder") {
      const isExpanded = expandedFolders.has(node.path);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.path}>
          <motion.div
            className="flex cursor-pointer select-none items-center gap-2 px-4 py-2 text-sm hover:bg-(--color-bg-hover) transition-colors group"
            style={{ paddingLeft: 8 + depth * 16 + "px" }}
            onClick={() => toggleFolder(node.path)}
          >
            {hasChildren && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={16} className="text-(--color-text-muted)" />
              </motion.div>
            )}
            {!hasChildren && <div className="w-4" />}

            {isExpanded ? (
              <FolderOpen size={16} className="text-(--color-accent)" />
            ) : (
              <Folder size={16} className="text-(--color-text-muted)" />
            )}
            <span className="font-medium text-(--color-text-primary) flex-1">
              {node.name}
            </span>

            {/* Create Subfolder button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParent(node.path);
                setShowNewFolderModal(true);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-(--color-bg-surface) rounded"
              title="Create subfolder"
            >
              <Plus
                size={16}
                className="text-(--color-text-muted) hover:text-(--color-accent)"
              />
            </button>

            {/* Upload button for folder */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUploadFolder(node.path);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-(--color-bg-surface) rounded"
              title="Upload files to this folder"
            >
              <Upload
                size={16}
                className="text-(--color-text-muted) hover:text-(--color-accent)"
              />
            </button>
          </motion.div>

          <AnimatePresence>
            {isExpanded && hasChildren && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {node.children?.map((child) =>
                  renderTreeNode(child, depth + 1),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // File node
    const file = node.file!;
    return (
      <motion.div
        key={file.id}
        className="flex items-center justify-between gap-4 border-b border-(--glass-border) bg-(--color-bg-surface) p-4 transition-colors duration-200 hover:bg-(--color-bg-hover)"
        style={{ paddingLeft: 8 + (depth + 1) * 16 + "px" }}
        onClick={() => handleFileClick(file)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer">
          <File size={16} className="shrink-0 text-(--color-text-muted)" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="overflow-hidden text-ellipsis font-medium text-sm">
              {file.name}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-(--color-text-muted)">
              {formatSize(file.size)} &bull; {file.extension || "Unknown"}
              {file.indexed_at &&
                ` • ${new Date(file.indexed_at).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 shrink-0">
          <div className="min-w-fit">{renderBadge(file)}</div>

          <div className="flex gap-2">
            {(file.chunk_count === 0 || !file.indexed_at) && (
              <button
                className="cursor-pointer rounded border border-(--color-border) bg-transparent px-2 py-1 text-xs text-(--color-text-secondary) hover:bg-(--color-bg-hover)"
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
        </div>
      </motion.div>
    );
  };

  const treeNodes = buildFileTree(files, folders);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex gap-2 justify-end">
        <button
          className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-accent) text-white px-3 py-2 text-sm shadow-(--shadow-sm) transition-all duration-300 hover:opacity-90"
          onClick={handleUploadDefault}
        >
          ⬆ Upload
        </button>
        <button
          className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) px-3 py-2 text-sm text-(--color-text-muted) shadow-(--shadow-sm) transition-all duration-300 hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          onClick={() => setShowNewFolderModal(true)}
        >
          + New Folder
        </button>
        <button
          className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) p-2 text-(--color-text-muted) shadow-(--shadow-sm) transition-all duration-300 hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
          onClick={fetchFiles}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
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
          ) : treeNodes.length === 0 ? (
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
              className="flex flex-col divide-y divide-glass-border"
            >
              {treeNodes.map((node) => renderTreeNode(node))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowNewFolderModal(false);
              setNewFolderParent("");
              setNewFolderName("");
            }}
          >
            <motion.div
              className="w-96 rounded-lg bg-(--color-bg-surface) p-6 shadow-lg"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">Create New Folder</h2>

              {newFolderParent && (
                <div className="mb-3 text-sm text-(--color-text-muted)">
                  Location:{" "}
                  <span className="font-mono">{newFolderParent}/</span>
                </div>
              )}

              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolderModal(false);
                    setNewFolderParent("");
                    setNewFolderName("");
                  }
                }}
                className="w-full rounded border border-(--color-border) bg-(--color-bg-input) px-3 py-2 text-(--color-text-primary) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-accent)"
                autoFocus
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="rounded border border-(--color-border) bg-transparent px-4 py-2 text-(--color-text-secondary) hover:bg-(--color-bg-hover)"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderParent("");
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="rounded border-0 bg-(--color-accent) px-4 py-2 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder || !newFolderName.trim()}
                >
                  {isCreatingFolder ? "Creating..." : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <R2UploadModal
            onClose={() => {
              setShowUploadModal(false);
              setTargetFolder(null);
              fetchFiles(); // Refresh files after upload
            }}
            onSuccess={() => {
              // Refresh files to show newly uploaded file
              setTimeout(() => {
                fetchFiles();
              }, 1000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && previewFileId && (
          <ImagePreviewModal
            fileId={previewFileId}
            fileName={previewFileName}
            onClose={() => {
              setShowImagePreview(false);
              setPreviewFileId(null);
              setPreviewFileName("");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadedFilesPanel;
