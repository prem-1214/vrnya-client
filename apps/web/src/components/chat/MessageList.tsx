import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { AgentSource, Message } from "../../hooks/useChat";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  isHistoryLoading?: boolean;
  onOpenPreview?: (target: AgentSource | { path: string }) => void;
  conversationId?: string; // ✅ NEW: For message actions
  onMessageUpdated?: (messageId: string, newContent: string) => void; // ✅ NEW
  onMessageDeleted?: (messageId: string) => void; // ✅ NEW
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  isHistoryLoading = false,
  onOpenPreview,
  conversationId, // ✅ NEW
  onMessageUpdated, // ✅ NEW
  onMessageDeleted, // ✅ NEW
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: "end" });
    });
  };

  useEffect(() => {
    const raf1 = window.requestAnimationFrame(() => {
      const raf2 = window.requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
      });
      return () => window.cancelAnimationFrame(raf2);
    });
    return () => window.cancelAnimationFrame(raf1);
  }, [messages.length, isTyping, isHistoryLoading]);

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 pb-4 pt-4 md:px-6 md:pb-6"
      ref={scrollRef}
    >
      {isHistoryLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="glass flex items-center gap-3 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) px-4 py-3 text-sm text-(--color-text-secondary) shadow-(--shadow-sm)">
            <Loader2 size={16} className="animate-spin text-(--color-accent)" />
            <span>Loading chat...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[560px] rounded-[28px] border border-dashed border-(--glass-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent),rgba(255,255,255,0.015)] px-6 py-12 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {/* <div className="empty-chat-icon">✨</div> */}
            <h3 className="mb-2 text-[1.75rem] text-(--color-text-primary)">
              How can I help you today?
            </h3>
            <p className="text-sm leading-relaxed text-(--color-text-secondary)">
              Index your files and ask me to find, read, or summarize them.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex w-full min-w-0 max-w-[1048px] flex-col gap-1.5">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              message={msg}
              disableAnimation={Boolean(msg.created_at)}
              onOpenPreview={onOpenPreview}
              onAnimationProgress={scrollToBottom}
              conversationId={conversationId}
              onMessageUpdated={onMessageUpdated}
              onMessageDeleted={onMessageDeleted}
            />
          ))}
        </div>
      )}
      {isTyping && !isHistoryLoading && (
        <div className="mx-auto flex w-full max-w-[1048px] justify-start pl-0 pr-0">
          <div className="glass flex items-center gap-1 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) px-3 py-1.5 shadow-(--shadow-sm)">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:400ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} className="mx-auto w-full max-w-[1048px]" aria-hidden="true" />
    </div>
  );
};

export default MessageList;
