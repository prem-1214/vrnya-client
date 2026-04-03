import React, { useState } from "react";
import { X, FileText, MessageSquare, Send, Loader2 } from "lucide-react";
import { summarizeDocument, chatWithDocument } from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./DocumentIntelligenceModal.css";

interface DocumentIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  filePath: string;
}

export const DocumentIntelligenceModal: React.FC<DocumentIntelligenceModalProps> = ({
  isOpen,
  onClose,
  fileId,
  fileName,
  filePath,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>(
    []
  );
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);

  // When modal is newly opened or file changes, reset state
  React.useEffect(() => {
    if (isOpen) {
      setSummary(null);
      setSummaryError(null);
      setIsSummarizing(false);
      setChatMessages([]);
      setChatInput("");
      setActiveTab("summary");
    }
  }, [isOpen, fileId]);

  const handleGenerateSummary = async () => {
    if (!fileId) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const response = await summarizeDocument(fileId);
      setSummary(response.summary);
    } catch (error: any) {
      setSummaryError(error.message || "Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !fileId) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsChatting(true);

    try {
      const response = await chatWithDocument(fileId, userMessage);
      setChatMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (error: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: `Error: ${error.message || "Failed to answer question"}` },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="di-modal-overlay">
      <motion.div
        className="di-modal glass"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="di-modal-header">
          <div className="di-modal-title">
            <h2>{fileName}</h2>
            <span>{filePath}</span>
          </div>
          <button className="di-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="di-modal-tabs">
          <button
            className={`di-tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText size={16} /> Summary
          </button>
          <button
            className={`di-tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={16} /> Chat
          </button>
        </div>

        <div className="di-modal-content">
          <AnimatePresence mode="wait">
            {activeTab === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="di-summary-container"
              >
                {!summary && !isSummarizing && !summaryError && (
                  <div className="di-center-action">
                    <p>No summary has been generated for this document yet.</p>
                    <button className="btn-primary" onClick={handleGenerateSummary}>
                      Generate AI Summary
                    </button>
                  </div>
                )}
                {isSummarizing && (
                  <div className="di-center-action">
                    <Loader2 size={32} className="spin accent-text" />
                    <p>Reading document and extracting key points...</p>
                  </div>
                )}
                {summaryError && (
                  <div className="di-center-action error">
                    <p>{summaryError}</p>
                    <button className="btn-secondary" onClick={handleGenerateSummary}>
                      Try Again
                    </button>
                  </div>
                )}
                {summary && (
                  <div className="di-summary-text markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summary}
                    </ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="di-chat-container"
              >
                <div className="di-chat-history">
                  {chatMessages.length === 0 ? (
                    <div className="di-chat-empty">
                      <MessageSquare size={32} />
                      <p>Ask anything about this document. The AI will strictly use the context from this file to answer.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div key={idx} className={`di-chat-bubble ${msg.role} markdown-body`}>
                        {msg.role === "ai" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          msg.text
                        )}
                      </div>
                    ))
                  )}
                  {isChatting && (
                    <div className="di-chat-bubble ai pending">
                      <Loader2 size={16} className="spin" /> Thinking...
                    </div>
                  )}
                </div>
                <form className="di-chat-input" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Ask a question about this file..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button type="submit" disabled={isChatting || !chatInput.trim()}>
                    <Send size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
