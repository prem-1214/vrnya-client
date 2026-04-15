import React, { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { AgentSource, Message } from "../../hooks/useChat";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  isHistoryLoading?: boolean;
  onOpenPreview?: (target: AgentSource | { path: string }) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  isHistoryLoading = false,
  onOpenPreview,
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
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 pt-6 md:px-6 md:pb-6"
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
        messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            disableAnimation={Boolean(msg.created_at)}
            onOpenPreview={onOpenPreview}
            onAnimationProgress={scrollToBottom}
          />
        ))
      )}
      {isTyping && !isHistoryLoading && (
        <div className="mx-auto mb-6 flex w-full max-w-[920px]">
          <div className="glass flex items-center gap-1 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) px-4 py-2 shadow-(--shadow-sm)">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-(--color-accent) opacity-60 [animation-delay:400ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
};

export default MessageList;
