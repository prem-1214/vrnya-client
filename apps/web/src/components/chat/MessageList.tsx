import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import type { AgentSource, Message } from "../../hooks/useChat";
import "./MessageList.css";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onOpenPreview?: (target: AgentSource | { path: string }) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  onOpenPreview,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="message-list" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="empty-chat">
          {/* <div className="empty-chat-icon">✨</div> */}
          <h3>How can I help you today?</h3>
          <p>Index your files and ask me to find, read, or summarize them.</p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            onOpenPreview={onOpenPreview}
          />
        ))
      )}
      {isTyping && (
        <div className="typing-indicator-row">
          <div className="typing-indicator glass">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
