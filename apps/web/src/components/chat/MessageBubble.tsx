import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { AgentSource, Message } from "../../hooks/useChat";
import MessageSourceList from "./MessageSourceList";
import MessageActions from "./MessageActions"; // ✅ NEW: Message actions (P3-11)
import { openPathInShell, showPathInFolder } from "../../platform/shell";
import { Volume2, VolumeX } from "lucide-react";
import { useSpeech } from "../../hooks/useSpeech";
import { useModal } from "../../context/ModalContext"; // ✅ NEW: Custom modal

interface MessageBubbleProps {
  message: Message;
  onOpenPreview?: (target: AgentSource | { path: string }) => void;
  isAutoSpeaking?: boolean;
  disableAnimation?: boolean;
  onAnimationProgress?: () => void;
  conversationId?: string; // ✅ NEW: For message actions
  onMessageUpdated?: (messageId: string, newContent: string) => void; // ✅ NEW
  onMessageDeleted?: (messageId: string) => void; // ✅ NEW
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenPreview,
  isAutoSpeaking = false,
  disableAnimation = false,
  onAnimationProgress,
  conversationId, // ✅ NEW
  onMessageUpdated, // ✅ NEW
  onMessageDeleted, // ✅ NEW
}) => {
  const { speak, stop, isSpeaking } = useSpeech();
  const { showError } = useModal(); // ✅ NEW: Use modal for errors
  const isUser = message.role === "user";

  // Sources and action path now come from structured message fields,
  // not from @@ACTION: markers embedded in content strings.
  const sources = message.sources ?? [];
  const actionPath = message.actionPath;

  const fullDisplayContent = message.content
    .replace(/@@ACTION:.*?@@/g, "")
    .trim();
  const [visibleContent, setVisibleContent] = useState(
    isUser ? fullDisplayContent : "",
  );

  const shouldAnimate = useMemo(() => {
    if (disableAnimation) return false;
    if (message.created_at) return false;
    if (isUser) return false;
    if (!fullDisplayContent) return false;
    return fullDisplayContent.length > 180;
  }, [disableAnimation, fullDisplayContent, isUser, message.created_at]);

  useEffect(() => {
    if (!shouldAnimate) {
      // ✅ FIXED: Update content immediately for real-time token streaming
      setVisibleContent(fullDisplayContent);
      return;
    }

    let index = 0;
    const step = 16;
    const intervalMs = 26;

    // setVisibleContent("");

    const timer = window.setInterval(() => {
      index = Math.min(index + step, fullDisplayContent.length);
      setVisibleContent(fullDisplayContent.slice(0, index));
      onAnimationProgress?.();
      if (index >= fullDisplayContent.length) {
        window.clearInterval(timer);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [fullDisplayContent, onAnimationProgress, shouldAnimate]);

  const displayContent = shouldAnimate ? visibleContent : fullDisplayContent;
  const revealComplete = displayContent.length >= fullDisplayContent.length;

  const handleOpen = async (
    target: AgentSource | { path: string } | string,
  ) => {
    const previewTarget =
      typeof target === "string" ? { path: target } : target;

    if (onOpenPreview) {
      onOpenPreview(previewTarget);
      return;
    }
    try {
      const error = await openPathInShell(previewTarget.path);
      if (error) {
        await showError(
          "Failed to Open File",
          `${error}\n\nPath: ${previewTarget.path}`,
        ); // ✅ UPDATED
      }
    } catch (err) {
      await showError("Error", `Error calling openPath: ${err}`); // ✅ UPDATED
    }
  };

  const handleShowInFolder = async (path: string) => {
    try {
      const error = await showPathInFolder(path);
      if (error)
        await showError("Failed to Open Folder", `${error}\n\nPath: ${path}`); // ✅ UPDATED
    } catch (err) {
      await showError("Error", `Error calling showInFolder: ${err}`); // ✅ UPDATED
    }
  };

  return (
    <motion.div
      initial={
        disableAnimation || message.created_at
          ? false
          : { opacity: 0, y: 10, scale: 0.95 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`mb-2 flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`relative min-w-0 rounded-[12px] shadow-[0_8px_20px_rgba(0,0,0,0.1)] max-w-[min(92%,26rem)] sm:max-w-[50%] ${
          isUser
            ? "rounded-br-[10px] border border-(--chat-user-bubble-border) bg-(--chat-user-bubble-bg) px-2.5 pb-2 pt-1.5 text-(--chat-user-bubble-fg) shadow-(--chat-user-bubble-shadow)"
            : "glass border border-(--glass-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)),var(--color-bg-surface)] px-2.5 pb-2 pt-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)] [backdrop-filter:blur(10px)] rounded-bl-[11px] rounded-br-[13px] rounded-t-[13px]"
        }`}
      >
        <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2 text-[8px] font-bold uppercase tracking-[0.08em]">
          <span
            className={
              isUser
                ? "text-(--chat-user-bubble-fg-soft)"
                : "text-(--color-accent)"
            }
          >
            {isUser ? "You" : "Assistant"}
          </span>
          <div className="flex items-center gap-2">
            {!isUser && revealComplete && (
              <button
                className={`flex items-center justify-center rounded p-0.5 transition-all duration-200 ${
                  isSpeaking
                    ? "text-(--color-accent) drop-shadow-[0_0_4px_var(--color-accent)]"
                    : "text-(--color-text-muted) opacity-60 hover:opacity-100"
                } hover:scale-110 hover:bg-(--glass-bg)`}
                onClick={() =>
                  isSpeaking ? stop() : speak(fullDisplayContent)
                }
                title={isSpeaking ? "Stop reading" : "Read aloud"}
                type="button"
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            )}
            {/* ✅ NEW: Message actions (P3-11) */}
            {conversationId && (
              <MessageActions
                messageId={message.id}
                conversationId={conversationId}
                content={message.content}
                role={message.role}
                onMessageUpdated={(newContent) =>
                  onMessageUpdated?.(message.id, newContent)
                }
                onMessageDeleted={() => onMessageDeleted?.(message.id)}
              />
            )}
            <span
              className={
                isUser
                  ? "text-(--chat-user-bubble-fg-soft) opacity-[0.88] tabular-nums"
                  : "text-(--color-text-muted)"
              }
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div
          className={`min-w-0 whitespace-pre-wrap leading-snug [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${
            isUser
              ? "text-[0.8125rem] text-(--chat-user-bubble-fg) [&_a]:text-(--color-accent) [&_a]:underline [&_code]:rounded-[4px] [&_code]:bg-(--inline-code-bg) [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.8em] [&_pre]:my-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-(--color-border) [&_pre]:bg-(--pre-bg) [&_pre]:p-1.5 [&_pre]:text-[0.8em] [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-0.5 [&_p+p]:mt-1.5 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
              : "prose text-[0.8125rem] text-(--color-text-primary) [&_p+p]:mt-1 [&_ul]:my-1 [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:pl-5 [&_li+li]:mt-0.5 [&_h1]:my-1 [&_h1]:leading-tight [&_h2]:my-1 [&_h2]:leading-tight [&_h3]:my-1 [&_h3]:leading-tight [&_pre]:my-1 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:text-[0.8em] [&_table]:my-1 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_blockquote]:my-1 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-(--color-accent) [&_blockquote]:bg-white/3 [&_blockquote]:px-2.5 [&_blockquote]:py-1.5 [&_blockquote]:text-(--color-text-secondary)"
          }`}
        >
          {message.fileDetails ? (
            <div>
              <strong className="mb-2 block">
                📄 {message.fileDetails.filename}
              </strong>
              <pre className="mb-2.5 max-h-[200px] overflow-auto rounded-md bg-(--panel-strong-bg) p-2.5 text-xs">
                {message.fileDetails.preview}
              </pre>
              <button
                className="inline-flex cursor-pointer items-center gap-1 rounded border border-(--glass-border) bg-(--glass-bg) px-2 py-1 text-[10px] font-semibold text-(--color-accent) transition-all duration-200 hover:-translate-y-px hover:bg-(--color-accent) hover:text-white"
                onClick={() => window.open(message.fileDetails!.url)}
              >
                Download File
              </button>
            </div>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
              {shouldAnimate && !revealComplete && (
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-2 animate-pulse rounded bg-(--color-accent) align-text-bottom"
                  aria-hidden="true"
                />
              )}
            </>
          )}
        </div>

        {/* File operation result — single action path (create, rename, etc.) */}
        {actionPath && revealComplete && sources.length === 0 && (
          <div className="mt-2.5 flex max-h-[280px] flex-col gap-1 overflow-y-auto border-t border-(--glass-border) pt-1.5">
            <div className="flex items-center justify-between rounded-md bg-(--panel-soft-bg) px-2 py-1 transition-colors duration-200 hover:bg-(--panel-strong-bg)">
              <span
                className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-(--color-text-secondary) max-[900px]:max-w-[120px]"
                title={actionPath}
              >
                {actionPath.split(/[/\\]/).pop()}
              </span>
              <div className="flex gap-1">
                <button
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-(--glass-border) bg-(--glass-bg) px-2 py-1 text-[10px] font-semibold text-(--color-accent) transition-all duration-200 hover:-translate-y-px hover:bg-(--color-accent) hover:text-white"
                  onClick={() => handleOpen({ path: actionPath })}
                  type="button"
                >
                  Preview
                </button>
                <button
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-(--glass-border) bg-(--glass-bg) px-2 py-1 text-[10px] font-semibold text-(--color-accent) transition-all duration-200 hover:-translate-y-px hover:bg-(--color-accent) hover:text-white"
                  onClick={() => handleShowInFolder(actionPath)}
                  type="button"
                >
                  Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File-backed answer sources — search results with attribution */}
        {sources.length > 0 && revealComplete && (
          <MessageSourceList sources={sources} onOpenPreview={handleOpen} />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
