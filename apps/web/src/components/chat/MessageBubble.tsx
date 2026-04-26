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
      className={`mb-4 flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`glass relative min-w-0 max-w-[80%] rounded-[18px] px-4 pb-4 pt-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)] max-[900px]:max-w-full ${
          isUser
            ? "rounded-br-lg bg-(--color-accent) text-(--message-user-text) shadow-[0_18px_40px_rgba(90,169,255,0.2)]"
            : "rounded-bl-lg border border-(--glass-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)),var(--color-bg-surface)] shadow-[0_12px_28px_rgba(0,0,0,0.12)] [backdrop-filter:blur(10px)]"
        }`}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-4 text-[10px] font-bold tracking-[0.08em] uppercase">
          <span
            className={
              isUser
                ? "text-(--message-user-text) opacity-70"
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
                {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
                  ? "text-(--message-user-text) opacity-70"
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
          className={`prose min-w-0 whitespace-pre-wrap text-[0.95rem] leading-relaxed ${
            isUser
              ? "text-(--message-user-text)"
              : "text-(--color-text-primary)"
          } [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p+p]:mt-2 [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5 [&_li+li]:mt-1 [&_h1]:my-2 [&_h1]:leading-tight [&_h2]:my-2 [&_h2]:leading-tight [&_h3]:my-2 [&_h3]:leading-tight [&_pre]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:text-[0.9em] [&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_blockquote]:my-2 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-(--color-accent) [&_blockquote]:bg-white/3 [&_blockquote]:px-3 [&_blockquote]:py-2 [&_blockquote]:text-(--color-text-secondary)`}
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
          <div className="mt-4 flex max-h-[300px] flex-col gap-1 overflow-y-auto border-t border-(--glass-border) pt-2">
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
