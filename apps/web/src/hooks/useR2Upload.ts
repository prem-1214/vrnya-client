import { useState, useCallback } from "react";
import { presignUpload, uploadFileToR2, confirmUpload } from "../api/client";

export type UploadStage =
  | "idle"
  | "presigning"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

export interface UploadState {
  stage: UploadStage;
  progress: number; // 0–100, only meaningful during 'uploading'
  error: string | null;
  fileId: string | null;
  fileName: string | null;
}

const INITIAL_STATE: UploadState = {
  stage: "idle",
  progress: 0,
  error: null,
  fileId: null,
  fileName: null,
};

export function useR2Upload() {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const upload = useCallback(async (file: File) => {
    setState({
      stage: "presigning",
      progress: 0,
      error: null,
      fileId: null,
      fileName: file.name,
    });

    try {
      // Step 1: Get presigned URL
      const { uploadUrl, r2Key } = await presignUpload({
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      // Step 2: Upload directly to R2
      setState((prev) => ({ ...prev, stage: "uploading" }));
      await uploadFileToR2(uploadUrl, file, (percent) => {
        setState((prev) => ({ ...prev, progress: percent }));
      });

      // Step 3: Confirm — server registers file + triggers background indexing
      setState((prev) => ({ ...prev, stage: "confirming", progress: 100 }));
      const { fileId } = await confirmUpload({
        r2Key,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      // Done - indexing happens server-side in the background
      setState((prev) => ({ ...prev, stage: "done", fileId }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setState((prev) => ({ ...prev, stage: "error", error: message }));
    }
  }, []);

  return { state, upload, reset };
}
