import React, { useState, useRef, useCallback, useEffect } from "react";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ChatPreviewPanel from "../components/chat/ChatPreviewPanel";
import { useChat, type AgentSource } from "../hooks/useChat";
import { useSpeech } from "../hooks/useSpeech";
import { useParams, useNavigate } from "react-router-dom";
import MemoryStatusChip from "../components/chat/MemoryStatusChip";

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    messages,
    isTyping,
    isHistoryLoading,
    send,
    sendVoice,
    generateAndInjectFile,
    error,
    loadHistory,
    clearMessages,
    conversationId,
  } = useChat();
  const { speak, stop: stopSpeech } = useSpeech();
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(() => {
    return localStorage.getItem("vrnya_auto_speak") === "true";
  });
  const [previewTarget, setPreviewTarget] = useState<
    AgentSource | { path: string } | null
  >(null);
  const [previewWidth, setPreviewWidth] = useState(400);
  const isResizing = useRef(false);
  const previousRouteIdRef = useRef<string | undefined>(id);

  useEffect(() => {
    localStorage.setItem("vrnya_auto_speak", String(isAutoSpeakEnabled));
  }, [isAutoSpeakEnabled]);

  // Auto-speak new assistant messages
  const lastProcessedMessageId = useRef<string | null>(null);
  useEffect(() => {
    if (!isAutoSpeakEnabled) return;
    
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage && 
      lastMessage.role === "assistant" && 
      !isTyping && 
      lastMessage.id !== lastProcessedMessageId.current
    ) {
      speak(lastMessage.content);
      lastProcessedMessageId.current = lastMessage.id;
    }
  }, [messages, isTyping, isAutoSpeakEnabled, speak]);

  useEffect(() => {
    if (id) {
      if (id !== conversationId) {
        loadHistory(id);
      }
    } else {
      const hadRouteBefore = Boolean(previousRouteIdRef.current);
      if (hadRouteBefore) {
        clearMessages();
      }
    }
    previousRouteIdRef.current = id;
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
  }, []);

  const stopResizing = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
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
    <div className="flex h-full flex-col">
      <header className="z-10 flex items-center justify-between rounded-t-xl border-b border-(--glass-border) bg-(--header-bg) px-8 py-4 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]">
        <div>
          <h1 className="text-md font-bold text-(--color-text-primary)">
            Agent Workspace
          </h1>
          <span className="text-xs text-(--color-text-muted)">
            AI-powered local file assistant
          </span>
        </div>
        <div className="flex items-center gap-4">
          <MemoryStatusChip enabled={true} />
          {error && (
            <div className="rounded-md border border-(--color-error) bg-[rgba(248,113,113,0.12)] px-4 py-2 text-xs text-(--color-error)">
              {error}
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 max-[1100px]:flex-col">
        <div className="flex min-w-0 flex-1 flex-col">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            isHistoryLoading={isHistoryLoading}
            onOpenPreview={setPreviewTarget}
          />

          <ChatInput
            onSend={send}
            onVoiceResult={({ transcript, agentResponse }) =>
              sendVoice(transcript, agentResponse)
            }
            onGenerate={generateAndInjectFile}
            onStop={() => {
              stop();
              stopSpeech();
            }}
            isAutoSpeakEnabled={isAutoSpeakEnabled}
            onToggleAutoSpeak={() => setIsAutoSpeakEnabled(!isAutoSpeakEnabled)}
            disabled={isTyping || isHistoryLoading}
          />
        </div>

        {previewTarget && (
          <div
            className="z-10 w-1 cursor-col-resize bg-transparent transition-colors duration-200 hover:bg-(--color-accent) active:bg-(--color-accent)"
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
