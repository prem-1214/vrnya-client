import React, { useState } from "react";
import { X, FileText, MessageSquare, Send, Loader2 } from "lucide-react";
import { summarizeDocument, chatWithDocument } from "../../api/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/40 [backdrop-filter:blur(4px)]">
      <motion.div
        className="glass flex h-[80vh] w-[90%] max-w-[800px] flex-col overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-surface) shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="flex items-center justify-between border-b border-(--color-border) bg-black/20 px-6 py-4">
          <div>
            <h2 className="line-clamp-1 text-[1.1rem] font-semibold text-(--color-text-primary)">
              {fileName}
            </h2>
            <span className="mt-0.5 block text-[0.8rem] text-(--color-text-secondary) opacity-70">
              {filePath}
            </span>
          </div>
          <button
            className="cursor-pointer rounded border-0 bg-transparent p-1 text-(--color-text-secondary) transition-all duration-200 hover:bg-white/10 hover:text-(--color-text-primary)"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-(--color-border) bg-black/10">
          <button
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 px-4 py-4 font-medium transition-all duration-200 ${
              activeTab === "summary"
                ? "border-b-(--color-accent) bg-(--color-accent-subtle) text-(--color-accent)"
                : "border-b-transparent bg-transparent text-(--color-text-secondary) hover:bg-white/5 hover:text-(--color-text-primary)"
            }`}
            onClick={() => setActiveTab("summary")}
            type="button"
          >
            <FileText size={16} /> Summary
          </button>
          <button
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 px-4 py-4 font-medium transition-all duration-200 ${
              activeTab === "chat"
                ? "border-b-(--color-accent) bg-(--color-accent-subtle) text-(--color-accent)"
                : "border-b-transparent bg-transparent text-(--color-text-secondary) hover:bg-white/5 hover:text-(--color-text-primary)"
            }`}
            onClick={() => setActiveTab("chat")}
            type="button"
          >
            <MessageSquare size={16} /> Chat
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute inset-0 flex flex-col overflow-y-auto p-6"
              >
                {!summary && !isSummarizing && !summaryError && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-text-secondary)">
                    <p>No summary has been generated for this document yet.</p>
                    <button
                      className="cursor-pointer rounded-lg border-0 bg-(--color-accent) px-5 py-2.5 font-medium text-white transition-all duration-200 hover:brightness-110"
                      onClick={handleGenerateSummary}
                      type="button"
                    >
                      Generate AI Summary
                    </button>
                  </div>
                )}
                {isSummarizing && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-text-secondary)">
                    <Loader2 size={32} className="animate-spin text-(--color-accent)" />
                    <p>Reading document and extracting key points...</p>
                  </div>
                )}
                {summaryError && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-error)">
                    <p>{summaryError}</p>
                    <button
                      className="cursor-pointer rounded-lg border border-(--color-border) bg-transparent px-5 py-2.5 font-medium text-(--color-text-primary) transition-all duration-200 hover:bg-(--color-bg-hover)"
                      onClick={handleGenerateSummary}
                      type="button"
                    >
                      Try Again
                    </button>
                  </div>
                )}
                {summary && (
                  <div className="markdown-body text-(--color-text-primary) leading-relaxed [&_p]:mb-4">
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
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-text-secondary) opacity-70">
                      <MessageSquare size={32} />
                      <p>Ask anything about this document. The AI will strictly use the context from this file to answer.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`markdown-body max-w-[80%] wrap-break-word rounded-xl p-4 leading-relaxed ${
                          msg.role === "user"
                            ? "self-end rounded-br-sm bg-(--color-accent) text-white"
                            : "self-start rounded-bl-sm border border-(--color-border) bg-white/5 text-(--color-text-primary)"
                        } [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:pl-6`}
                      >
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
                    <div className="flex items-center gap-2 self-start rounded-xl rounded-bl-sm border border-(--color-border) bg-white/5 px-4 py-3 text-(--color-text-primary) opacity-70">
                      <Loader2 size={16} className="animate-spin" /> Thinking...
                    </div>
                  )}
                </div>
                <form className="flex gap-2 border-t border-(--color-border) bg-black/20 p-4" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Ask a question about this file..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                    className="flex-1 rounded-lg border border-(--color-border) bg-white/5 px-4 py-3 text-(--color-text-primary) outline-none transition-colors duration-200 placeholder:text-(--color-text-muted) focus:border-(--color-accent)"
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="flex w-11 items-center justify-center rounded-lg border-0 bg-(--color-accent) text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
