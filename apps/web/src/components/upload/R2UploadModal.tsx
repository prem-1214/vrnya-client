import React, { useCallback, useRef, useState } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useR2Upload, type UploadStage } from "../../hooks/useR2Upload";
import "./R2UploadModal.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
].join(",");

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "",
  presigning: "Preparing upload...",
  uploading: "Uploading to cloud...",
  confirming: "Registering file...",
  done: "Done!",
  error: "Upload failed",
};

interface R2UploadModalProps {
  onClose: () => void;
  onSuccess?: (fileId: string, fileName: string) => void;
}

const R2UploadModal: React.FC<R2UploadModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state, upload, reset } = useR2Upload();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      upload(file).then(() => {
        // onSuccess is called after done state is set
      });
    },
    [upload],
  );

  // Watch for done state to call onSuccess
  React.useEffect(() => {
    if (state.stage === "done" && state.fileId && state.fileName) {
      onSuccess?.(state.fileId, state.fileName);
    }
  }, [state.stage, state.fileId, state.fileName, onSuccess]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isActive =
    state.stage !== "idle" && state.stage !== "error" && state.stage !== "done";
  const isDone = state.stage === "done";
  const isError = state.stage === "error";

  return (
    <div className="r2-modal-overlay" onClick={onClose}>
      <motion.div
        className="r2-modal glass"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="r2-modal-header">
          <div className="r2-modal-title">
            <CloudUpload size={20} className="r2-modal-title-icon" />
            <span>Upload to Cloud</span>
          </div>
          <button
            className="r2-modal-close"
            onClick={onClose}
            disabled={isActive}
          >
            <X size={18} />
          </button>
        </div>

        <div className="r2-modal-body">
          <AnimatePresence mode="wait">
            {state.stage === "idle" ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className={`r2-dropzone ${dragOver ? "r2-dropzone--active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={36} className="r2-dropzone-icon" />
                  <p className="r2-dropzone-label">
                    Drag & drop a file here, or{" "}
                    <span className="r2-link">click to browse</span>
                  </p>
                  <p className="r2-dropzone-hint">
                    PDF, DOCX, TXT, MD, CSV, JSON, HTML — max 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="r2-file-input"
                    onChange={handleInputChange}
                    id="r2-file-input"
                  />
                </div>
              </motion.div>
            ) : isDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="r2-status-panel r2-status-panel--success"
              >
                <CheckCircle
                  size={44}
                  className="r2-status-icon r2-status-icon--success"
                />
                <p className="r2-status-title">Upload Complete</p>
                <p className="r2-status-detail">
                  <strong>{state.fileName}</strong> has been uploaded and
                  indexed successfully.
                </p>
                <div className="r2-done-actions">
                  <button className="r2-btn r2-btn--primary" onClick={onClose}>
                    Done
                  </button>
                  <button className="r2-btn r2-btn--ghost" onClick={reset}>
                    Upload Another
                  </button>
                </div>
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="r2-status-panel r2-status-panel--error"
              >
                <AlertCircle
                  size={44}
                  className="r2-status-icon r2-status-icon--error"
                />
                <p className="r2-status-title">Upload Failed</p>
                <p className="r2-status-detail">{state.error}</p>
                <button className="r2-btn r2-btn--primary" onClick={reset}>
                  Try Again
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="r2-progress-panel"
              >
                <Loader2 size={36} className="r2-progress-spinner" />
                <p className="r2-progress-label">{STAGE_LABELS[state.stage]}</p>
                <p className="r2-progress-filename">{state.fileName}</p>

                {state.stage === "uploading" && (
                  <div className="r2-progress-bar-wrap">
                    <div
                      className="r2-progress-bar-fill"
                      style={{ width: `${state.progress}%` }}
                    />
                    <span className="r2-progress-pct">{state.progress}%</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default R2UploadModal;
