import React, { useState, useRef, useCallback, useEffect } from "react";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ChatPreviewPanel from "../components/chat/ChatPreviewPanel";
import { useChat } from "../hooks/useChat";
import "./ChatPage.css";

const ChatPage: React.FC = () => {
  const { messages, isTyping, send, sendVoice, error } = useChat();
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState(400);
  const isResizing = useRef(false);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.body.classList.add("is-resizing");
  }, []);

  const stopResizing = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      document.body.classList.remove("is-resizing");
    }
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 320 && newWidth < window.innerWidth - 300) {
        setPreviewWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="chat-page">
      <header className="page-header glass">
        <div className="header-info">
          <h1>Agent Workspace</h1>
          <span>AI-powered local file assistant</span>
        </div>
        {error && <div className="error-toast glass">{error}</div>}
      </header>

      <div className="chat-workspace">
        <div className="chat-main">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            onOpenPreview={setPreviewPath}
          />

          <ChatInput
            onSend={send}
            onVoiceResult={({ transcript, agentResponse }) =>
              sendVoice(transcript, agentResponse)
            }
            onStop={stop}
            disabled={isTyping}
          />
        </div>

        {previewPath && (
          <div
            className="chat-resizer"
            onMouseDown={startResizing}
            title="Drag to resize"
          />
        )}

        <ChatPreviewPanel
          path={previewPath}
          onClose={() => setPreviewPath(null)}
          width={previewWidth}
        />
      </div>
    </div>
  );
};

export default ChatPage;
