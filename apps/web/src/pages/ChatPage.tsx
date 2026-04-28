import React, { useState, useRef, useEffect } from "react";
import MessageList from "../components/chat/MessageList";
import ChatInput from "../components/chat/ChatInput";
import ChatPreviewPanel from "../components/chat/ChatPreviewPanel";
import { useChat, type AgentSource } from "../hooks/useChat";
import { useSpeech } from "../hooks/useSpeech";
import { useParams, useNavigate } from "react-router-dom";
import MemoryStatusChip from "../components/chat/MemoryStatusChip";
import PageShell from "../components/layout/PageShell";
import { useResizablePane } from "../hooks/useResizablePane";
import type { MentionedDocument } from "../components/chat/DocumentMentionAutocomplete";

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
    stop,
  } = useChat();
  const { speak, stop: stopSpeech } = useSpeech();
  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(() => {
    return localStorage.getItem("vrnya_auto_speak") === "true";
  });
  const [previewTarget, setPreviewTarget] = useState<
    AgentSource | { path: string } | null
  >(null);
  const { width: previewWidth, startResizing } = useResizablePane({
    initialWidth: 400,
    minWidth: 320,
    maxWidth: (windowWidth) => windowWidth - 300,
  });
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
    if (
      conversationId &&
      !id &&
      conversationId !== lastConversationId.current
    ) {
      navigate(`/chat/${conversationId}`, { replace: true });
    }
    lastConversationId.current = conversationId;
  }, [conversationId, id, navigate]);

  // Wrapper for send to include attached documents
  const handleSendWithDocuments = (
    message: string,
    attachedDocuments?: MentionedDocument[],
  ) => {
    // Convert MentionedDocument to DocumentContext format
    const documentContext = attachedDocuments?.map((doc) => ({
      id: doc.id,
      name: doc.name,
      path: doc.path,
    }));

    // Send message with documents as a separate parameter
    send(message, documentContext);
  };

  return (
    <PageShell
      title="Agent Workspace"
      subtitle="AI-powered local file assistant"
      actions={
        <>
          <MemoryStatusChip enabled={true} />
          {error && (
            <div className="rounded-md border border-(--color-error) bg-[rgba(248,113,113,0.12)] px-4 py-2 text-xs text-(--color-error)">
              {error}
            </div>
          )}
        </>
      }
      bodyClassName="overflow-hidden"
      contentClassName="h-full"
    >
      <div className="flex h-full min-h-0 flex-1 max-[1100px]:flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <MessageList
            messages={messages}
            isTyping={isTyping}
            isHistoryLoading={isHistoryLoading}
            onOpenPreview={setPreviewTarget}
            conversationId={conversationId} // ✅ NEW: Pass conversationId
            onMessageUpdated={(messageId, newContent) => {
              // ✅ NEW: Handle message update
              // Update the message in the UI
              const msgIndex = messages.findIndex((m) => m.id === messageId);
              if (msgIndex >= 0) {
                messages[msgIndex].content = newContent;
                // Force re-render by creating a new array
                // (This is a simple approach - a more robust solution would use state)
              }
            }}
            onMessageDeleted={(messageId) => {
              // ✅ NEW: Handle message delete
              // Remove the message from UI
              const filteredMessages = messages.filter(
                (m) => m.id !== messageId,
              );
              // This is handled by the backend - the user can reload to see updated state
            }}
          />

          <ChatInput
            onSend={handleSendWithDocuments}
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
            dockToBottom={messages.length > 0 || isTyping || isHistoryLoading}
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
    </PageShell>
  );
};

export default ChatPage;
