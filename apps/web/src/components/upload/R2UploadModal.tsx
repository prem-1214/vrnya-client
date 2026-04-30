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
import { useDialogA11y } from "../../hooks/useDialogA11y";
import { useUploadContext } from "../../context/UploadContext";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
].join(",");

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "",
  presigning: "Preparing upload...",
  uploading: "Uploading to cloud...",
  confirming: "Registering file...",
  done: "Done!",
  error: "Upload or indexing failed",
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
  const { targetFolder } = useUploadContext();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      upload(file, targetFolder || undefined);
    },
    [upload, targetFolder],
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
  const didUploadSucceed = Boolean(state.fileId);
  useDialogA11y({ isOpen: true, onClose, initialFocusRef: closeButtonRef });

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/55 p-4 [backdrop-filter:blur(6px)]"
      onClick={onClose}
    >
      <motion.div
        className="glass w-full max-w-[520px] overflow-hidden rounded-lg shadow-(--shadow-lg)"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="r2-upload-modal-title"
      >
        <div className="flex items-center justify-between border-b border-(--color-border-subtle) px-6 py-4">
          <div className="flex items-center gap-2 text-md font-semibold text-(--color-text-primary)">
            <CloudUpload size={20} className="text-(--color-accent)" />
            <span id="r2-upload-modal-title">Upload to Cloud</span>
          </div>
          <button
            ref={closeButtonRef}
            className="flex items-center rounded-sm border-0 bg-transparent p-1 text-(--color-text-muted) transition-colors duration-200 hover:text-(--color-text-primary) disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onClose}
            disabled={isActive}
            type="button"
            aria-label="Close upload dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-[240px] flex-col justify-center p-6">
          <AnimatePresence mode="wait">
            {state.stage === "idle" ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${
                    dragOver
                      ? "border-(--color-accent) bg-(--color-accent-subtle)"
                      : "border-(--color-border) hover:border-(--color-accent) hover:bg-(--color-accent-subtle)"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose file to upload to cloud"
                >
                  <Upload
                    size={36}
                    className="text-(--color-accent) opacity-80"
                  />
                  <p className="text-md text-(--color-text-secondary)">
                    Drag & drop a file here, or{" "}
                    <span className="cursor-pointer text-(--color-accent) underline">
                      click to browse
                    </span>
                  </p>
                  <p className="text-xs text-(--color-text-muted)">
                    PDF, DOCX, TXT, MD, CSV, JSON, HTML, PNG, JPG, WEBP, GIF —
                    max 50MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={handleInputChange}
                    id="r2-file-input"
                  />
                </button>
              </motion.div>
            ) : isDone ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-6 text-center"
              >
                <CheckCircle size={44} className="text-(--color-success)" />
                <p className="text-lg font-semibold text-(--color-text-primary)">
                  Upload Complete
                </p>
                <p className="max-w-[340px] text-sm text-(--color-text-muted)">
                  <strong>{state.fileName}</strong> has been uploaded and
                  indexed successfully.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="cursor-pointer rounded-sm border-0 bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-(--color-accent-hover)"
                    onClick={onClose}
                    type="button"
                  >
                    Done
                  </button>
                  <button
                    className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors duration-200 hover:bg-(--color-bg-hover)"
                    onClick={reset}
                    type="button"
                  >
                    Upload Another
                  </button>
                </div>
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 py-6 text-center"
              >
                <AlertCircle
                  size={44}
                  className={
                    didUploadSucceed
                      ? "text-(--color-warning)"
                      : "text-(--color-error)"
                  }
                />
                <p className="text-lg font-semibold text-(--color-text-primary)">
                  {didUploadSucceed
                    ? "Upload Complete, Indexing Failed"
                    : "Upload Failed"}
                </p>
                <p className="max-w-[340px] text-sm text-(--color-text-muted)">
                  {state.error}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="cursor-pointer rounded-sm border-0 bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-(--color-accent-hover)"
                    onClick={reset}
                    type="button"
                  >
                    Try Again
                  </button>
                  {didUploadSucceed && (
                    <button
                      className="cursor-pointer rounded-sm border border-(--color-border) bg-(--color-bg-surface) px-4 py-2 text-sm font-medium text-(--color-text-secondary) transition-colors duration-200 hover:bg-(--color-bg-hover)"
                      onClick={onClose}
                      type="button"
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-6"
              >
                <Loader2
                  size={36}
                  className="animate-spin text-(--color-accent)"
                />
                <p className="text-md font-medium text-(--color-text-primary)">
                  {STAGE_LABELS[state.stage]}
                </p>
                <p className="max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-(--color-text-muted)">
                  {state.fileName}
                </p>

                {state.stage === "uploading" && (
                  <div className="relative h-2 w-full max-w-[360px] overflow-hidden rounded-full bg-(--color-border-subtle)">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-accent-hover))] shadow-[0_0_8px_var(--color-accent-glow)] transition-[width] duration-300 ease-in-out"
                      style={{ width: `${state.progress}%` }}
                    />
                    <span className="absolute right-0 top-3.5 text-xs text-(--color-text-muted)">
                      {state.progress}%
                    </span>
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
