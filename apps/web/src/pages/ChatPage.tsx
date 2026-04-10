import React, { useState, useRef, useCallback, useEffect } from "react";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ChatPreviewPanel from "../components/chat/ChatPreviewPanel";
import { useChat, type AgentSource } from "../hooks/useChat";
import { useParams, useNavigate } from "react-router-dom";
import MemoryStatusChip from "../components/chat/MemoryStatusChip";
import "./ChatPage.css";

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { messages, isTyping, send, sendVoice, error, loadHistory, clearMessages, conversationId } = useChat();
  const [previewTarget, setPreviewTarget] = useState<
    AgentSource | { path: string } | null
  >(null);
  const [previewWidth, setPreviewWidth] = useState(400);
  const isResizing = useRef(false);

  useEffect(() => {
    if (id) {
      if (id !== conversationId) {
        loadHistory(id);
      }
    } else {
      clearMessages();
    }
  }, [id, loadHistory, clearMessages, conversationId]);

  // Handle redirecting to new conversation URL after first message
  const lastConversationId = useRef<string | null>(null);
  useEffect(() => {
    if (conversationId && !id && conversationId !== lastConversationId.current) {
      navigate(`/chat/${conversationId}`, { replace: true });
    }
    lastConversationId.current = conversationId;
  }, [conversationId, id, navigate]);

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
        <div className="flex items-center gap-4">
          <MemoryStatusChip enabled={true} />
          {error && <div className="error-toast glass">{error}</div>}
        </div>
      </header>

      <div className="chat-workspace">
        <div className="chat-main">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            onOpenPreview={setPreviewTarget}
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

        {previewTarget && (
          <div
            className="chat-resizer"
            onMouseDown={startResizing}
            title="Drag to resize"
          />
        )}

        <ChatPreviewPanel
          target={previewTarget}
          onClose={() => setPreviewTarget(null)}
          width={previewWidth}
        />
      </div>
    </div>
  );
};

export default ChatPage;
