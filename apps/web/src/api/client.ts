import type { Message } from "../hooks/useChat";

export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ---------------------- updated types for new filesystem module ----------------------
export interface FileSystemEntry {
  id?: string;
  name: string;
  path: string;
  type: "file" | "directory";
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedEntriesResponse {
  items: FileSystemEntry[];
  pagination: PaginationInfo;
}

export interface FileMutationResult {
  created: string;
  path: string;
  success: string;
  existed?: boolean;
  unchanged?: boolean;
  contentMatches?: boolean;
}

export interface CompareFileResult {
  pathA: string;
  pathB: string;
  identical: boolean;
  totalLinesA: number;
  totalLinesB: number;
  differences: Array<{
    lineNumber: number;
    type: "added" | "removed" | "changed";
    contentA?: string;
    contentB?: string;
  }>;
  summary: string;
}

export interface DeleteFileResult {
  path: string;
  deleted: boolean;
  permanent: boolean;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  r2Key: string;
  expiresInSeconds: number;
}
export type Profession = "student" | "working_professional" | "startup";

export interface WaitlistSignupResponse {
  success: boolean;
  alreadyJoined: boolean;
  message: string;
}
export interface ConfirmUploadResponse {
  fileId: string;
  r2Key: string;
  name: string;
  message: string;
  jobId?: string;
}
export interface JobStatusResponse {
  state:
    | "waiting"
    | "active"
    | "completed"
    | "failed"
    | "delayed"
    | "prioritized";
  progress: number;
  failedReason: string | null;
}
export interface R2IndexResponse {
  fileId: string;
  chunks: number;
  message: string;
}
export interface R2DownloadUrlResponse {
  downloadUrl: string;
  expiresInSeconds: number;
}

export interface ChatResponse {
  conversationId: string;
  answer: any;
}

export interface ChatStreamEvent {
  type: "conversation" | "status" | "answer" | "done" | "error";
  text?: string;
  answer?: any;
  error?: string;
  code?: string;
  retryable?: boolean;
  retryAfter?: number;
  conversationId?: string;
}

// ---------------------- existing types and API functions ----------------------
export interface HealthResponse {
  status: string;
  db: string;
}

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  name?: string;
  path?: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface IndexResponse {
  fileId?: string;
  chunks?: number;
  indexedFiles?: number;
  totalChunks?: number;
  indexedPaths?: number;
  skippedFiles?: number;
  skipped?: Array<{ path: string; reason: string }>;
  unchanged?: boolean;
}

export interface AllowedIndexPath {
  path: string;
  kind: "file" | "directory";
  createdAt: string;
  updatedAt: string;
  lastIndexedAt: string | null;
}

export interface AllowedIndexPathsResponse {
  paths: AllowedIndexPath[];
}

// In-memory token store — never persisted to localStorage
let _accessToken: string | null = null;

// Singleton refresh promise — shared across ALL callers:
// AuthContext session restore + apiFetch 401 handler.
// Guarantees only ONE refresh HTTP request fires at any time.
let _refreshInFlight: Promise<{ accessToken: string }> | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string | null) => {
    _accessToken = token;
  },
  clear: () => {
    _accessToken = null;
  },
};

// Call this instead of authApi.refresh() directly.
// Safe to call concurrently — returns the same promise to all callers.
export async function singletonRefresh(): Promise<{ accessToken: string }> {
  if (_refreshInFlight) return _refreshInFlight;

  _refreshInFlight = fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Refresh failed");
      return res.json() as Promise<{ accessToken: string }>;
    })
    .finally(() => {
      _refreshInFlight = null;
    });

  return _refreshInFlight;
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (_accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // needed so HttpOnly refresh cookie is sent
  });

  // Silent refresh on 401 — try once before failing
  if (res.status === 401 && !endpoint.includes("/auth/")) {
    const refreshed = await attemptSilentRefresh();
    if (refreshed) {
      // Retry original request with new token
      return apiFetch<T>(endpoint, options);
    }
    // Refresh failed — clear token, let the app handle redirect
    tokenStore.clear();
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API Request failed");
  }

  return res.json();
}

async function attemptSilentRefresh(): Promise<boolean> {
  try {
    const data = await singletonRefresh();
    tokenStore.set(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const healthCheck = () => apiFetch<HealthResponse>("/health");

export const joinWaitlist = (payload: {
  email: string;
  name?: string;
  company?: string;
  useCase?: string;
  profession?: Profession;
  source?: string;
}) =>
  apiFetch<WaitlistSignupResponse>("/api/v1/waitlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getConfig = () =>
  apiFetch<Record<string, string>>("/api/v1/config");

export const sendMessage = (message: string, conversationId?: string | null) =>
  apiFetch<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversationId }),
  });

export async function sendMessageStream(
  message: string,
  conversationId: string | null | undefined,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
    },
    body: JSON.stringify({ message, conversationId }),
    signal,
  });

  if (!res.ok || !res.body) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Chat stream request failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || signal?.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          onEvent(JSON.parse(trimmed) as ChatStreamEvent);
        } catch {
          // ignore malformed partial lines
        }
      }
    }
  } finally {
    reader.cancel();
  }

  if (!signal?.aborted && buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer.trim()) as ChatStreamEvent);
    } catch {}
  }
}

export const sendVoiceMessage = (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  return fetch(`${BASE_URL}/api/v1/voice`, {
    method: "POST",
    headers: {
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
    },
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Voice API Request failed");
    }
    return res.json();
  });
};

export const searchFiles = (q: string, extensions?: string[]) => {
  const params = new URLSearchParams({ q });

  if (extensions && extensions.length > 0) {
    params.append("extensions", extensions.join(","));
  }
  return apiFetch<SearchResponse>(`/api/v1/search?${params.toString()}`);
};

export const indexPath = (path: string) =>
  apiFetch<IndexResponse>("/api/v1/index", {
    method: "POST",
    body: JSON.stringify({ path }),
  });

export const indexAllPaths = () =>
  apiFetch<IndexResponse>("/api/v1/index/all", {
    method: "POST",
  });

export const listAllowedIndexPaths = () =>
  apiFetch<AllowedIndexPathsResponse>("/api/v1/index/paths");

export const addAllowedIndexPath = (path: string) =>
  apiFetch<AllowedIndexPath>("/api/v1/index/paths", {
    method: "POST",
    body: JSON.stringify({ path }),
  });

export const removeAllowedIndexPath = (path: string) =>
  apiFetch<{ success: boolean }>("/api/v1/index/paths", {
    method: "DELETE",
    body: JSON.stringify({ path }),
  });

// ----------------------- new API function for filesystem module ----------------------
export const listDirectory = (params: {
  path?: string;
  recursive?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
}): Promise<FileSystemEntry[] | PaginatedEntriesResponse> => {
  const query = new URLSearchParams();
  if (params.path) query.append("path", params.path);
  if (params.recursive) query.append("recursive", "true");
  if (params.page) query.append("page", String(params.page));
  if (params.pageSize) query.append("pageSize", String(params.pageSize));
  if (params.limit) query.append("limit", String(params.limit));

  return apiFetch<FileSystemEntry[] | PaginatedEntriesResponse>(
    `/api/v1/filesystem/list?${query.toString()}`,
  );
};

export const readFile = (path: string) =>
  apiFetch<{ content: string; path: string }>(
    `/api/v1/filesystem/read?path=${encodeURIComponent(path)}`,
  );

export const createFile = (path: string, content: string) =>
  apiFetch<FileMutationResult>("/api/v1/filesystem/create", {
    method: "POST",
    body: JSON.stringify({ path, content }),
  });

export const renameFile = (oldPath: string, newPath: string) =>
  apiFetch<FileMutationResult>("/api/v1/filesystem/rename", {
    method: "PUT",
    body: JSON.stringify({ oldPath, newPath }),
  });

export const moveToTrash = (path: string) =>
  apiFetch<FileMutationResult>("/api/v1/filesystem/trash", {
    method: "DELETE",
    body: JSON.stringify({ path }),
  });

export const deleteFileApi = (path: string, permanent = false) =>
  apiFetch<DeleteFileResult>("/api/v1/filesystem/delete", {
    method: "DELETE",
    body: JSON.stringify({ path, permanent }),
  });

export const compareFiles = (pathA: string, pathB: string) =>
  apiFetch<CompareFileResult>(
    `/api/v1/filesystem/compare?pathA=${encodeURIComponent(pathA)}&pathB=${encodeURIComponent(pathB)}`,
  );

// ----------------------- new API functions for explicit Document Intelligence ----------------------
export const getDocumentById = (fileId: string) =>
  apiFetch<{
    document: {
      id: string;
      name: string;
      path: string;
      content: string;
      extension: string;
    };
  }>(`/api/v1/documents/${fileId}`);

export const summarizeDocument = (fileId: string, force = false) =>
  apiFetch<{ summary: string }>(`/api/v1/documents/${fileId}/summarize`, {
    method: "POST",
    body: JSON.stringify({ force }),
  });

export interface UploadedFile {
  id: string;
  name: string;
  extension: string;
  size: number;
  storage_type: "r2" | "local";
  indexed_at: string | null;
  chunk_count: number;
}

export const listUploadedFiles = () =>
  apiFetch<{ files: UploadedFile[] }>("/api/v1/documents");

export const chatWithDocument = (fileId: string, question: string) =>
  apiFetch<{ text: string; path?: string; conversationId: string }>(
    `/api/v1/documents/${fileId}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ question }),
    },
  );

export const getDocumentChatHistory = (fileId: string) =>
  apiFetch<{
    conversationId: string | null;
    messages: Array<{
      id: string;
      role: "user" | "ai";
      text: string;
      created_at: string;
    }>;
  }>(`/api/v1/documents/${fileId}/chat`);

export const indexAllPathsWithProgress = async (
  onProgress: (event: {
    type: "progress" | "done" | "error" | "result";
    current: number;
    total: number;
    currentFile: string;
    failed: number;
    message?: string;
    indexedPath?: number;
    indexedFiles?: number;
    totalChunks?: number;
    skippedFiles?: number;
  }) => void,
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/v1/index/all/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
    },
  });
  if (!response.ok || !response.body) {
    throw new Error("Failed to start progress stream");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) continue;

      try {
        onProgress(JSON.parse(trimmed));
      } catch {}
    }
  }
  if (buffer.trim()) {
    try {
      onProgress(JSON.parse(buffer.trim()));
    } catch {}
  }
};

export const indexPathWithProgress = async (
  targetPath: string,
  onProgress: (event: {
    type: "progress" | "done" | "error" | "result";
    current: number;
    total: number;
    currentFile: string;
    failed: number;
    message?: string;
  }) => void,
): Promise<void> => {
  const response = await fetch(`${BASE_URL}/api/v1/index/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tokenStore.get()
        ? { Authorization: `Bearer ${tokenStore.get()}` }
        : {}),
    },
    body: JSON.stringify({ path: targetPath }),
  });
  if (!response.ok || !response.body) {
    throw new Error("Failed to start progress stream");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value: value_1 } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value_1, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        onProgress(JSON.parse(trimmed));
      } catch {}
    }
  }
  if (buffer.trim()) {
    try {
      onProgress(JSON.parse(buffer.trim()));
    } catch {}
  }
};

export const presignUpload = (payload: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}) =>
  apiFetch<PresignUploadResponse>("/api/v1/upload/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const confirmUpload = (payload: {
  r2Key: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}) =>
  apiFetch<ConfirmUploadResponse>("/api/v1/upload/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
export const getR2DownloadUrl = (fileId: string) =>
  apiFetch<R2DownloadUrlResponse>(`/api/v1/upload/${fileId}/download-url`);
export const indexR2File = (fileId: string) =>
  apiFetch<R2IndexResponse>("/api/v1/index/r2", {
    method: "POST",
    body: JSON.stringify({ fileId }),
  });
export const deleteUploadedFile = (fileId: string) =>
  apiFetch<{ message: string }>(`/api/v1/upload/${fileId}`, {
    method: "DELETE",
  });
export const getJobStatus = (jobId: string) =>
  apiFetch<JobStatusResponse>(`/api/v1/upload/jobs/${jobId}`);
/**
 * Upload a file directly to R2 using a presigned PUT URL.
 * This goes browser → R2 directly (skips the server).
 */
export async function uploadFileToR2(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  contentType?: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("R2 upload network error")),
    );
    xhr.addEventListener("abort", () => reject(new Error("R2 upload aborted")));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType ?? file.type);
    xhr.send(file);
  });
}

// ----------------------- Auth API -----------------------

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    displayName?: string;
  }) =>
    apiFetch<{ accessToken: string; user: AuthUser }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; user: AuthUser }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: (): Promise<{ accessToken: string }> =>
    fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    }).then((r) => {
      if (!r.ok) throw new Error("Refresh failed");
      return r.json();
    }),

  logout: () =>
    fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    }),

  me: () => apiFetch<{ user: AuthUser }>("/api/v1/auth/me"),

  googleSignInUrl: () => `${BASE_URL}/api/v1/auth/google`,
};

// -------------------------------- memory ----------------------------

export type MemoryType =
  | "user_profile"
  | "user_preference"
  | "project_context"
  | "working_goal"
  | "important_decision";

export interface MemoryItem {
  id: string;
  memory_type: MemoryType;
  memory_key: string;
  memory_value: string;
  confidence: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export const listMemories = () => apiFetch<MemoryItem[]>("/api/v1/memory");

export const deleteMemory = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/v1/memory/${id}`, {
    method: "DELETE",
  });

export const clearAllMemories = () =>
  apiFetch<{ success: boolean }>("/api/v1/memory", {
    method: "DELETE",
  });

export const listConversations = () =>
  apiFetch<Conversation[]>("/api/v1/conversations");

export const listMessages = (conversationId: string) =>
  apiFetch<Message[]>(`/api/v1/conversations/${conversationId}/messages`);

export const deleteConversation = (id: string) =>
  apiFetch<{ success: boolean }>(`/api/v1/conversations/${id}`, {
    method: "DELETE",
  });

export const generateFile = (prompt: string) =>
  apiFetch<{
    fileId: string;
    filename: string;
    mimeType: string;
    url: string;
    preview: string;
  }>("/api/v1/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
