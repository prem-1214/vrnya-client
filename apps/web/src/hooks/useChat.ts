import { useState, useCallback, useRef } from "react";
import { sendMessageStream } from "../api/client";

export interface AgentSource {
  id?: string;
  name?: string;
  path: string;
  content?: string;
  similarity?: number;
  extension?: string;
  storage_type?: "r2" | "local";
  r2_key?: string;
}

// Matches AgentResult from server/src/agent/index.ts
export interface AgentResult {
  text: string;
  route?: string;
  path?: string;
  sources?: AgentSource[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: AgentSource[];
  actionPath?: string;
  timestamp: Date;
}

// ─── Response formatter ───────────────────────────────────────────────────────
// Consumes the stable AgentResult envelope directly.
// No shape sniffing, no @@ACTION: string injection.
// Sources and action paths are returned as structured data, not embedded strings.

interface FormattedResponse {
  content: string;
  sources?: AgentSource[];
  actionPath?: string;
}

function logRenderedAssistantResponse(response: FormattedResponse): void {
  console.info("[chat-ui] Assistant response rendered", {
    content: response.content,
    sources: response.sources ?? [],
    actionPath: response.actionPath ?? null,
  });
}

export function formatAgentResponse(answer: unknown): FormattedResponse {
  // Stable AgentResult envelope from the backend
  if (answer && typeof answer === "object" && !Array.isArray(answer)) {
    const obj = answer as Record<string, unknown>;

    // Must have a text field to be a valid AgentResult
    if (typeof obj.text === "string") {
      const sources = Array.isArray(obj.sources)
        ? (obj.sources as AgentSource[]).filter((s) => Boolean(s.path))
        : undefined;

      const actionPath =
        typeof obj.path === "string" && obj.path.trim() ? obj.path : undefined;

      return {
        content: obj.text,
        sources: sources && sources.length > 0 ? sources : undefined,
        actionPath,
      };
    }

    // Paged list result (list_files / list_directory)
    if (Array.isArray(obj.items)) {
      const items = obj.items as Record<string, unknown>[];
      const pagination = obj.pagination as Record<string, unknown> | undefined;
      const page =
        typeof pagination?.page === "number" ? pagination.page : undefined;
      const totalPages =
        typeof pagination?.totalPages === "number"
          ? pagination.totalPages
          : undefined;
      const total =
        typeof pagination?.total === "number" ? pagination.total : items.length;

      const header =
        page && totalPages
          ? `Files found (page ${page}/${totalPages}, ${total} total)`
          : `Files found (${items.length} items)`;

      if (items.length === 0) {
        return { content: `${header}\n\nNo files found.` };
      }

      const lines = items.map((item) => {
        const name = typeof item.name === "string" ? item.name : "Unknown";
        const isDir = item.type === "directory";
        const icon = isDir ? "📂" : "📄";
        return `- ${icon} \`${name}\``;
      });

      return { content: `${header}\n\n${lines.join("\n")}` };
    }
  }

  // Plain string (general knowledge, simple confirmations)
  if (typeof answer === "string") {
    return { content: answer.replace(/\\/g, "\\\\") };
  }

  // Empty array
  if (Array.isArray(answer) && answer.length === 0) {
    return { content: "No results found." };
  }

  // Fallback — should not reach here with the new backend
  console.warn("[useChat] Unexpected answer shape:", answer);
  return {
    content: "```json\n" + JSON.stringify(answer, null, 2) + "\n```",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const send = useCallback(async (content: string) => {
    if (!content.trim()) return;

    abortControllerRef.current?.abort(); // cancel any in flight request

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage = createMessage("user", content);
    const assistantMessage = createMessage(
      "assistant",
      "Thinking through your request...",
    );

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsTyping(true);
    setError(null);

    try {
      await sendMessageStream(
        content,
        (event) => {
          if (event.type === "status") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content: event.text || "Thinking..." }
                  : message,
              ),
            );
            return;
          }

          if (event.type === "answer") {
            const response = formatAgentResponse(event.answer);
            logRenderedAssistantResponse(response);
            const { content, sources, actionPath } = response;
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessage.id
                  ? { ...message, content, sources, actionPath }
                  : message,
              ),
            );
            return;
          }

          if (event.type === "error") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessage.id
                  ? {
                      ...message,
                      content: `I couldn't complete the request: ${event.error || "the stream failed"}.`,
                    }
                  : message,
              ),
            );
            throw new Error(event.error || "Chat stream failed");
          }
        },
        controller.signal,
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User clicked Stop — show "stopped" message, no error toast
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: "Request stopped." }
              : msg,
          ),
        );
        return;
      }
      const message =
        err instanceof Error ? err.message : "Failed to send message";
      setError(message);
    } finally {
      setIsTyping(false);
    }
  }, []);

  // Injects a voice result directly — skips the agent call since the
  // voice endpoint already ran it. Avoids the double-request bug.
  const sendVoice = useCallback(
    (transcript: string, agentResponse: unknown) => {
      const userMessage = createMessage("user", transcript);
      const response = formatAgentResponse(agentResponse);
      logRenderedAssistantResponse(response);
      const { content, sources, actionPath } = response;
      const assistantMessage: Message = {
        ...createMessage("assistant", content),
        sources,
        actionPath,
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    send,
    sendVoice,
    stop,
    clearMessages,
  };
};
