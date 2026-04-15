import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  File,
  ChevronRight,
  Home,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { listDirectory, type FileSystemEntry } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { openPathInShell } from "../platform/shell";

import UploadedFilesPanel from "./UploadedFilesPanel";

const FilesPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [items, setItems] = useState<FileSystemEntry[]>([]);
  const [view, setView] = useState<"local" | "uploaded">("uploaded");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchFiles = async (path: string | null) => {
    if (view !== "local") return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await listDirectory({
        path: path ?? undefined,
        recursive: false,
      });

      if (Array.isArray(response)) {
        setItems(response);
      } else {
        setItems(response.items);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load files";
      setError(message || "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === "local") {
      fetchFiles(currentPath);
    }
  }, [currentPath, view]);

  const handleNavigate = (path: string | null) => {
    setCurrentPath(path);
  };

  const handleOpenFile = async (item: FileSystemEntry) => {
    if (item.id) {
      navigate(`/document/${item.id}`);
      return;
    }

    try {
      const error = await openPathInShell(item.path);
      if (error) {
        setError(`Failed to open file: ${error}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to open file";
      setError(message);
    }
  };

  const getParantPath = (targetPath: string | null): string | null => {
    if (!targetPath) return null;

    const normalized = targetPath.replace(/[\\/]+$/, "");
    const parts = normalized.split(/[\\/]/).filter(Boolean);

    if (parts.length <= 1) {
      return null;
    }

    const parantParts = parts.slice(0, -1);

    if (/^[a-zA-Z]:$/.test(parantParts[0])) {
      return parantParts.length === 1
        ? `${parantParts[0]}\\`
        : `${parantParts[0]}\\${parantParts.slice(1).join("\\")}`;
    }

    return parantParts.join("\\");
  };

  const handleGoUp = () => {
    setCurrentPath((prev) => getParantPath(prev));
  };

  const breadcrumbs =
    currentPath === null
      ? ["Root"]
      : ["Root", ...currentPath.split(/[\\/]/).filter(Boolean)];

  const viewToggleBtnClass = (isActive: boolean) =>
    `rounded-sm px-4 py-1.5 text-sm transition-all duration-200 ${
      isActive
        ? "bg-(--color-bg-hover) font-medium text-(--color-text-primary) shadow-(--shadow-sm)"
        : "bg-transparent font-medium text-(--color-text-secondary)"
    }`;

  return (
    <div className="flex h-full flex-col">
      <header className="z-10 flex items-center justify-between rounded-t-xl border-b border-(--glass-border) bg-(--header-bg) px-8 py-4 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]">
        <div>
          <h1 className="text-md font-bold text-(--color-text-primary)">
            File Explorer
          </h1>
          <span className="text-xs text-(--color-text-muted)">
            Browse and manage your local and uploaded files
          </span>
          <div className="mt-4 flex w-fit gap-1 rounded-md border border-(--color-border) bg-(--color-bg-surface) p-1">
            <button
              className={viewToggleBtnClass(view === "local")}
              onClick={() => setView("local")}
            >
              Local Files
            </button>
            <button
              className={viewToggleBtnClass(view === "uploaded")}
              onClick={() => setView("uploaded")}
            >
              Uploaded Files
            </button>
          </div>
        </div>
        {view === "local" && (
          <button
            className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) p-2 text-(--color-text-muted) shadow-(--shadow-sm) transition-all duration-300 hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
            onClick={() => fetchFiles(currentPath)}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-8">
        {view === "local" ? (
          <>
            <nav className="flex items-center gap-2 rounded-md border border-(--glass-border) bg-(--color-bg-surface) px-4 py-2 text-xs text-(--color-text-secondary) shadow-(--shadow-sm)">
              <Home
                size={16}
                className="cursor-pointer transition-all duration-200 hover:bg-(--color-bg-hover) active:scale-98"
                onClick={() => handleNavigate(null)}
              />
              <button
                className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-inherit text-inherit transition-all duration-200 hover:bg-(--color-bg-hover) disabled:cursor-not-allowed disabled:opacity-60 active:scale-98"
                onClick={handleGoUp}
                disabled={currentPath === null}
              >
                <ArrowUp size={16} />
                Up
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <ChevronRight size={14} className="opacity-30" />
                  )}
                  <span className="font-medium text-(--color-text-primary)">
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>

            <div className="grid grid-cols-[minmax(0,1fr)_100px_80px] px-4 pb-1 text-[10px] font-bold tracking-widest text-(--color-text-muted) uppercase">
              <span>Name</span>
              <span className="text-right">Actions</span>
              <span className="text-right">Type</span>
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
                    <p>Loading directory contents...</p>
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
                      onClick={() => fetchFiles(currentPath)}
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col"
                  >
                    {items.map((item, idx) => (
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="grid grid-cols-[minmax(0,1fr)_100px_80px] items-center border-b border-(--glass-border) bg-(--color-bg-surface) p-4 text-sm transition-colors duration-200 last:border-b-0 hover:bg-(--color-bg-hover)"
                      >
                        <div
                          className="flex flex-1 cursor-pointer items-center gap-3"
                          onClick={() =>
                            item.type === "directory"
                              ? handleNavigate(item.path)
                              : handleOpenFile(item)
                          }
                        >
                          {item.type === "directory" ? (
                            <Folder size={18} className="text-(--color-accent)" />
                          ) : (
                            <File
                              size={18}
                              className="text-(--color-text-muted)"
                            />
                          )}
                          <span>{item.name}</span>
                        </div>

                        <div className="flex justify-end gap-2">
                          {item.type === "file" && item.id && (
                            <button
                              className="flex cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-2 py-1 text-(--color-accent)"
                              title="Ask AI about this file"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFile(item);
                              }}
                            >
                              <Sparkles size={16} />
                              <span className="text-xs">Analyze</span>
                            </button>
                          )}
                        </div>
                        <span className="text-right text-[10px] text-(--color-text-muted) uppercase">
                          {item.type}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <UploadedFilesPanel />
        )}
      </div>
    </div>
  );
};

export default FilesPage;
