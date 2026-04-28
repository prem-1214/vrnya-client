import { useState, useCallback, useEffect, useRef } from "react";
import {
  presignUpload,
  uploadFileToR2,
  confirmUpload,
  getJobStatus,
} from "../api/client";

export type UploadStage =
  | "idle"
  | "validating"
  | "presigning"
  | "uploading"
  | "confirming"
  | "indexing"
  | "done"
  | "error";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export interface UploadItem {
  id: string; // client-side tracking ID
  fileName: string;
  stage: UploadStage;
  uploadProgress: number; // 0–100, network upload progress
  indexProgress: number; // 0–100, BullMQ embedding progress
  error: string | null;
  fileId: string | null;
  jobId: string | null;
}

const makeId = () => Math.random().toString(36).slice(2, 10);

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
};

const getMimeTypeFromFile = (file: File): string => {
  if (file.type) return file.type;
  const extensionMatch = file.name.toLowerCase().match(/\.[^./\\]+$/);
  if (!extensionMatch) return "";
  return EXTENSION_TO_MIME[extensionMatch[0]] ?? "";
};

export function useR2Upload() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [currentState, setCurrentState] = useState<{
    stage: UploadStage;
    fileName: string;
    uploadProgress: number;
    indexProgress: number;
    fileId: string | null;
    jobId: string | null;
    error: string | null;
  }>({
    stage: "idle",
    fileName: "",
    uploadProgress: 0,
    indexProgress: 0,
    fileId: null,
    jobId: null,
    error: null,
  });
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const itemsRef = useRef<UploadItem[]>(items);

  // Keep itemsRef in sync so polling callback always reads fresh state
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  // Poll BullMQ status for all items currently in "indexing" stage
  useEffect(() => {
    const poll = async () => {
      const indexing = itemsRef.current.filter(
        (i) => i.stage === "indexing" && i.jobId,
      );
      if (!indexing.length) return;

      await Promise.all(
        indexing.map(async (item) => {
          try {
            const status = await getJobStatus(item.jobId!);
            if (status.state === "completed") {
              updateItem(item.id, { stage: "done", indexProgress: 100 });
            } else if (status.state === "failed") {
              updateItem(item.id, {
                stage: "error",
                error: status.failedReason ?? "Indexing failed",
              });
            } else {
              updateItem(item.id, {
                indexProgress:
                  (status.progress as number) ?? item.indexProgress,
              });
            }
          } catch (err: unknown) {
            // 404 = job not found in Redis (most likely completed and expired)
            // Treat as done to avoid items being stuck indefinitely
            const is404 =
              err instanceof Error && err.message.toLowerCase().includes("404");
            const isNotFound =
              err instanceof Error &&
              err.message.toLowerCase().includes("not found");
            if (is404 || isNotFound) {
              updateItem(item.id, { stage: "done", indexProgress: 100 });
            }
            // All other errors: don't change state, keep polling
          }
        }),
      );
    };

    pollingRef.current = setInterval(() => {
      void poll();
    }, 2500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const uploadSingle = useCallback(
    async (file: File, folderPath?: string) => {
      const id = makeId();

      // Client-side validation
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setItems((prev) => [
          ...prev,
          {
            id,
            fileName: file.name,
            stage: "error",
            uploadProgress: 0,
            indexProgress: 0,
            error: `File exceeds the 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
            fileId: null,
            jobId: null,
          },
        ]);
        return;
      }

      // Add item as presigning
      setItems((prev) => [
        ...prev,
        {
          id,
          fileName: file.name,
          stage: "presigning",
          uploadProgress: 0,
          indexProgress: 0,
          error: null,
          fileId: null,
          jobId: null,
        },
      ]);

      try {
        const mimeType = getMimeTypeFromFile(file);
        if (!mimeType) {
          updateItem(id, {
            stage: "error",
            error: "Unsupported file type or missing MIME type",
          });
          return;
        }

        // Step 1: Presign (include folderPath if provided)
        const { uploadUrl, r2Key } = await presignUpload({
          fileName: file.name,
          mimeType,
          fileSizeBytes: file.size,
          folderPath,
        });

        // Step 2: Upload to R2
        updateItem(id, { stage: "uploading" });
        await uploadFileToR2(
          uploadUrl,
          file,
          (percent) => {
            updateItem(id, { uploadProgress: percent });
          },
          mimeType,
        );

        // Step 3: Confirm (include folderPath if provided)
        updateItem(id, { stage: "confirming", uploadProgress: 100 });
        const result = await confirmUpload({
          r2Key,
          fileName: file.name,
          mimeType,
          fileSizeBytes: file.size,
          folderPath,
        });

        // Step 4: Move to indexing (BullMQ job is running in background)
        updateItem(id, {
          stage: "indexing",
          fileId: result.fileId,
          jobId: result.jobId ?? null,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        updateItem(id, { stage: "error", error: message });
      }
    },
    [updateItem],
  );

  const uploadMultiple = useCallback(
    (files: FileList | File[], folderPath?: string) => {
      const fileArray = Array.from(files);
      fileArray.forEach((file) => {
        uploadSingle(file, folderPath); // fire all in parallel with same folderPath
      });
    },
    [uploadSingle],
  );

  const dismissItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) =>
      prev.filter((item) => item.stage !== "done" && item.stage !== "error"),
    );
  }, []);

  const hasCompleted = items.some(
    (i) => i.stage === "done" || i.stage === "error",
  );
  const isIdle = items.length === 0;

  // Single upload wrapper for modal (tracks currentState)
  const upload = useCallback(
    (file: File, folderPath?: string) => {
      setCurrentState({
        stage: "presigning",
        fileName: file.name,
        uploadProgress: 0,
        indexProgress: 0,
        fileId: null,
        jobId: null,
        error: null,
      });
      uploadSingle(file, folderPath);
    },
    [uploadSingle],
  );

  const reset = useCallback(() => {
    setCurrentState({
      stage: "idle",
      fileName: "",
      uploadProgress: 0,
      indexProgress: 0,
      fileId: null,
      jobId: null,
      error: null,
    });
  }, []);

  // Watch for items changes and update currentState
  useEffect(() => {
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      setCurrentState({
        stage: lastItem.stage,
        fileName: lastItem.fileName,
        uploadProgress: lastItem.uploadProgress,
        indexProgress: lastItem.indexProgress,
        fileId: lastItem.fileId,
        jobId: lastItem.jobId,
        error: lastItem.error,
      });
    }
  }, [items]);

  return {
    // New single-upload API (for modal)
    state: currentState,
    upload,
    reset,
    // Existing multi-upload API (for batch uploads)
    items,
    uploadMultiple,
    dismissItem,
    clearCompleted,
    hasCompleted,
    isIdle,
  };
}
