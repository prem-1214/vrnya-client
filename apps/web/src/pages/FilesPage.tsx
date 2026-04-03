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
import "./FilesPage.css";

const FilesPage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [items, setItems] = useState<FileSystemEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchFiles = async (path: string | null) => {
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
    fetchFiles(currentPath);
  }, [currentPath]);

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

  return (
    <div className="files-page">
      <header className="page-header glass">
        <div className="header-info">
          <h1>File Explorer</h1>
          <span>Browse and manage your local files</span>
        </div>
        <button
          className="refresh-btn"
          onClick={() => fetchFiles(currentPath)}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "spin" : ""} />
        </button>
      </header>

      <div className="files-container">
        <nav className="breadcrumb-nav glass">
          <Home
            size={16}
            className="selectable"
            onClick={() => handleNavigate(null)}
          />
          <button
            className="crumb-up selectable"
            onClick={handleGoUp}
            disabled={currentPath === null}
            style={{
              border: "none",
              background: "none",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: 0,
              font: "inherit",
            }}
          >
            <ArrowUp size={16} />
            Up
          </button>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={14} className="crumb-sep" />}
              <span className="crumb-item">{crumb}</span>
            </React.Fragment>
          ))}
        </nav>

        <div className="files-grid-header">
          <span className="col-name">Name</span>
          <span className="col-actions">Actions</span>
          <span className="col-type">Type</span>
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
                <p>Loading directory contents...</p>
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
                <button onClick={() => fetchFiles(currentPath)}>
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="files-grid"
              >
                {items.map((item, idx) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="file-item selectable"
                  >
                    <div
                      className="file-info col-name"
                      onClick={() =>
                        item.type === "directory"
                          ? handleNavigate(item.path)
                          : handleOpenFile(item)
                      }
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                      }}
                    >
                      {item.type === "directory" ? (
                        <Folder size={18} className="folder-icon" />
                      ) : (
                        <File size={18} className="file-icon" />
                      )}
                      <span>{item.name}</span>
                    </div>

                    <div
                      className="col-actions"
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        flex: 1,
                      }}
                    >
                      {item.type === "file" && item.id && (
                        <button
                          className="ai-action-btn"
                          title="Ask AI about this file"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFile(item);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent)",
                            cursor: "pointer",
                            padding: "4px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            borderRadius: "4px",
                          }}
                        >
                          <Sparkles size={16} />
                          <span style={{ fontSize: "12px" }}>Analyze</span>
                        </button>
                      )}
                    </div>
                    <span className="col-type">{item.type}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
