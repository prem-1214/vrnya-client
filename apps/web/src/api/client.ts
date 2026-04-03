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

// ---------------------- existing types and API functions ----------------------
export interface HealthResponse {
  status: string;
  db: string;
}

export interface ChatResponse {
  answer: any;
}

export interface ChatStreamEvent {
  type: "status" | "answer" | "done" | "error";
  text?: string;
  answer?: any;
  error?: string;
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

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API Request failed");
  }

  return res.json();
}

export const healthCheck = () => apiFetch<HealthResponse>("/health");

export const getConfig = () =>
  apiFetch<Record<string, string>>("/api/v1/config");

export const sendMessage = (message: string) =>
  apiFetch<ChatResponse>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export async function sendMessageStream(
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
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

export const chatWithDocument = (fileId: string, question: string) =>
  apiFetch<{ text: string; path?: string }>(
    `/api/v1/documents/${fileId}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ question }),
    },
  );

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
    headers: { "Content-Type": "application/json" },
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
