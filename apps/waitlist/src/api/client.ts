export const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:4000" : "");

export type Profession = "student" | "working_professional" | "startup";

export interface WaitlistSignupResponse {
  success: boolean;
  alreadyJoined: boolean;
  message: string;
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "API Request failed");
  }

  return res.json();
}

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
