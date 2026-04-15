import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Send,
  Loader2,
  File,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import * as docx from "docx-preview";

import {
  getDocumentById,
  summarizeDocument,
  chatWithDocument,
  getDocumentChatHistory,
  getR2DownloadUrl,
  BASE_URL,
} from "../api/client";

// ─── Highlight helpers ────────────────────────────────────────────────────────

// Finds the first occurrence of matchText in fullText (case-insensitive,
// whitespace-normalized) and splits fullText into [before, match, after].
// Returns null if not found.
function splitAtMatch(
  fullText: string,
  matchText: string,
): [string, string, string] | null {
  if (!matchText || !fullText) return null;

  // Normalize whitespace for matching — chunks may have different line endings
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  const normalFull = normalize(fullText);
  const normalMatch = normalize(matchText);

  // Try progressively shorter prefixes of the match until we find something
  // (handles cases where the chunk starts mid-sentence in the full doc)
  const attempts = [
    normalMatch,
    normalMatch.slice(0, Math.floor(normalMatch.length * 0.7)),
    normalMatch.slice(0, Math.floor(normalMatch.length * 0.4)),
  ].filter((s) => s.length >= 20);

  for (const attempt of attempts) {
    const idx = normalFull.indexOf(attempt);
    if (idx === -1) continue;

    // Map normalized index back to original text index
    // (approximate — works well enough for scroll positioning)
    const ratio = idx / normalFull.length;
    const originalIdx = Math.floor(ratio * fullText.length);

    const before = fullText.slice(0, originalIdx);
    const after = fullText.slice(originalIdx + attempt.length);
    const matched = fullText.slice(originalIdx, originalIdx + attempt.length);

    return [before, matched, after];
  }

  return null;
}

// Renders text with the matched section highlighted and a ref attached for scrolling
function HighlightedText({
  content,
  highlightText,
  highlightRef,
}: {
  content: string;
  highlightText: string;
  highlightRef: React.RefObject<HTMLElement | null>;
}) {
  const parts = splitAtMatch(content, highlightText);

  if (!parts) {
    return (
      <pre className="m-0 whitespace-pre-wrap font-mono text-[0.9rem] leading-6 text-(--color-text-primary)">
        {content}
      </pre>
    );
  }

  const [before, match, after] = parts;

  return (
    <pre className="m-0 whitespace-pre-wrap font-mono text-[0.9rem] leading-6 text-(--color-text-primary)">
      {before}
      <mark
        ref={highlightRef}
        className="rounded-[2px] bg-amber-300/30 px-0 py-px"
      >
        {match}
      </mark>
      {after}
    </pre>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface LocationState {
  highlightText?: string;
  query?: string;
}

const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as LocationState;
  const highlightText = locationState.highlightText ?? null;

  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isChatHistoryLoading, setIsChatHistoryLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatting, activeTab]);

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [isDocxLoading, setIsDocxLoading] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  // Ref attached to the highlighted chunk — used for scrolling
  const highlightRef = useRef<HTMLElement>(null);
  const secondaryBtnClass =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-(--color-border) bg-transparent px-5 py-2.5 text-[0.9rem] font-medium text-(--color-text-primary) transition-all duration-200 hover:bg-(--color-bg-hover) disabled:cursor-not-allowed disabled:opacity-50";
  const primaryBtnClass =
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border-0 bg-(--color-accent) px-5 py-2.5 text-[0.9rem] font-medium text-(--message-user-text) transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      setIsLoading(true);
      setChatMessages([]);
      try {
        const response = await getDocumentById(id);
        const doc = response.document as {
          id: string;
          extension: string;
          storage_type?: string;
          r2_key?: string;
          [key: string]: unknown;
        };
        setDocument(doc);

        // For R2-stored PDFs, pre-fetch a presigned download URL
        if (doc.extension === ".pdf" && doc.storage_type === "r2") {
          try {
            const { downloadUrl } = await getR2DownloadUrl(id);
            setPdfUrl(downloadUrl);
          } catch {
            // non-fatal: iframe will just show empty
          }
        }

        // For R2-stored DOCX, fetch and prepare buffer for docx-preview
        if (
          (doc.extension === ".docx" || doc.extension === ".doc") &&
          doc.storage_type === "r2"
        ) {
          setIsDocxLoading(true);
          try {
            const { downloadUrl } = await getR2DownloadUrl(id);
            const res = await fetch(downloadUrl);
            const arrayBuffer = await res.arrayBuffer();
            setDocxBuffer(arrayBuffer);
          } catch {
            // fallback to plain text if conversion fails
          } finally {
            setIsDocxLoading(false);
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load document";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const loadChatHistory = async () => {
      setIsChatHistoryLoading(true);
      try {
        const history = await getDocumentChatHistory(id);
        setChatMessages(history.messages.map((message) => ({
          role: message.role,
          text: message.text,
        })));
      } catch {
        setChatMessages([]);
      } finally {
        setIsChatHistoryLoading(false);
      }
    };

    loadChatHistory();
  }, [id]);

  // Scroll to the highlighted section after content loads
  useEffect(() => {
    if (!highlightText || isLoading || !document) return;

    // Small delay to let the DOM paint before scrolling
    const timer = setTimeout(() => {
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [highlightText, isLoading, document]);

  const handleGenerateSummary = async (force = false) => {
    if (!id) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const response = await summarizeDocument(id, force);
      setSummary(response.summary);
    } catch (err: any) {
      setSummaryError(err.message || "Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !id) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsChatting(true);
    try {
      const response = await chatWithDocument(id, userMessage);
      setChatMessages((prev) => [...prev, { role: "ai", text: response.text }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Error: ${err.message || "Failed to answer question"}`,
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const maxW = window.innerWidth * 0.6;
      let newWidth = window.innerWidth - e.clientX - 16;
      if (newWidth < 250) newWidth = 250;
      if (newWidth > maxW) newWidth = maxW;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.document.body.style.cursor = "default";
      window.document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.document.body.style.cursor = "col-resize";
      window.document.body.style.userSelect = "none";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Render the DOCX file when buffer and container are ready
  useEffect(() => {
    if (docxBuffer && docxContainerRef.current) {
      void docx.renderAsync(docxBuffer, docxContainerRef.current, undefined, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        experimental: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true
      });
    }
  }, [docxBuffer]);

  useEffect(() => {
    if (!docxContainerRef.current) return;
    const wrapper = docxContainerRef.current.querySelector(".docx-wrapper") as
      | HTMLElement
      | null;
    if (!wrapper) return;
    wrapper.style.background = "transparent";
    wrapper.style.padding = "0";
    wrapper.style.display = "block";
    wrapper.style.overflowX = "auto";
    const section = wrapper.querySelector("section.docx") as HTMLElement | null;
    if (section) {
      section.style.margin = "0 auto";
    }
  }, [docxBuffer]);

  // ─── Render helpers ──────────────────────────────────────────────────────

  function renderDocumentContent() {
    if (!document) return null;

    if (document.extension === ".pdf") {
      // For R2-stored PDFs, use a presigned direct URL (avoids server stream redirect)
      const pdfSrc =
        document.storage_type === "r2" && document.r2_key
          ? null // handled below with pdfUrl state
          : `${BASE_URL}/api/v1/documents/${document.id}/stream`;

      return (
        <iframe
          src={pdfSrc ?? pdfUrl ?? undefined}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="PDF Viewer"
        />
      );
    }

    if (document.extension === ".md") {
      // Markdown: highlight by wrapping matched text in a span
      // For simplicity we render as raw text when a highlight is requested,
      // since ReactMarkdown doesn't support injecting refs easily.
      if (highlightText) {
        return (
          <HighlightedText
            content={document.content}
            highlightText={highlightText}
            highlightRef={highlightRef}
          />
        );
      }
      return (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {document.content}
          </ReactMarkdown>
        </div>
      );
    }

    if (document.extension === ".docx" || document.extension === ".doc") {
      if (document.storage_type === "r2" && isDocxLoading) {
        return (
          <div className="doc-viewer-loading" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={32} className="spin accent-text" />
            <p style={{ marginLeft: "1rem" }}>Rendering document...</p>
          </div>
        );
      }

      return (
        <div
          ref={docxContainerRef}
          className="docx-rendered-container"
          style={{
            maxWidth: "100%",
            minHeight: "100%",
          }}
        />
      );
    }

    // Plain text / code
    if (highlightText) {
      return (
        <HighlightedText
          content={document.content}
          highlightText={highlightText}
          highlightRef={highlightRef}
        />
      );
    }

    return (
      <pre className="m-0 whitespace-pre-wrap font-mono text-[0.9rem] leading-6 text-(--color-text-primary)">
        {document.content}
      </pre>
    );
  }

  // ─── Loading / error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-(--color-text-secondary)">
        <Loader2 size={32} className="animate-spin text-(--color-accent)" />
        <p>Loading document context...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-(--color-text-secondary)">
        <AlertCircle size={32} />
        <h2 className="m-0 text-(--color-error)">Failed to open document</h2>
        <p>{error}</p>
        <button className={secondaryBtnClass} onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="box-border flex h-screen gap-4 overflow-hidden bg-transparent p-4">
      {/* LEFT PANE: Document Content */}
      <div className="glass flex flex-2 flex-col overflow-hidden rounded-lg border border-(--color-border)">
        <header className="flex items-center gap-4 rounded-t-lg border-b border-(--color-border) bg-(--panel-soft-bg) p-4">
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-(--color-border) bg-transparent text-(--color-text-primary) transition-colors duration-200 hover:bg-(--color-bg-hover)"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="m-0 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-base">
              <File size={16} className="text-(--color-text-muted)" />
              {document.name}
            </h2>
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--color-text-secondary)">
              {document.path}
            </span>
          </div>
        </header>

        {document.isTruncated && document.extension !== ".pdf" && (
          <div className="flex items-center gap-2 border-b border-amber-300/30 bg-amber-300/10 px-4 py-3 text-[0.85rem] text-amber-400">
            <AlertTriangle size={16} />
            <span>
              This document is very large (
              {Math.round(document.originalSize / 1024 / 1024)}MB). For
              performance reasons, only the first 100KB is displayed here.{" "}
              <strong>
                You can still chat with and summarize the entire document using
                the AI.
              </strong>
            </span>
          </div>
        )}

        {highlightText && (
          <div className="flex items-center gap-1.5 border-b border-amber-200/20 bg-amber-200/10 px-4 py-2 text-[0.8rem] text-(--color-text-secondary)">
            <span>↓ Scrolled to matching section</span>
          </div>
        )}

        <div
          className="flex-1 overflow-y-auto bg-(--color-bg-surface) p-8"
          style={{ padding: document.extension === ".pdf" ? 0 : undefined }}
        >
          {renderDocumentContent()}
        </div>
      </div>

      {/* DRAG DIVIDER */}
      <div
        className={`flex w-2.5 cursor-col-resize items-center justify-center rounded transition-colors duration-200 ${
          isResizing ? "bg-(--color-bg-hover)" : "hover:bg-(--color-bg-hover)"
        }`}
        onMouseDown={startResizing}
        data-testid="resizer"
      >
        <div
          className={`h-8 w-1 rounded ${
            isResizing ? "bg-(--color-accent)" : "bg-(--color-border)"
          }`}
        />
      </div>

      {/* RIGHT PANE: Intelligence Sidebar */}
      <div
        className="glass flex flex-col overflow-hidden rounded-lg border border-(--color-border)"
        style={{ width: `${sidebarWidth}px`, flex: "none" }}
      >
        <div className="flex border-b border-(--color-border) bg-(--panel-soft-bg)">
          <button
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 px-4 py-4 font-medium transition-all duration-200 ${
              activeTab === "summary"
                ? "border-b-(--color-accent) bg-(--color-bg-hover) text-(--color-accent)"
                : "border-b-transparent bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText size={14} /> Summary
          </button>
          <button
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 px-4 py-4 font-medium transition-all duration-200 ${
              activeTab === "chat"
                ? "border-b-(--color-accent) bg-(--color-bg-hover) text-(--color-accent)"
                : "border-b-transparent bg-transparent text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
            }`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>

        <div className="relative flex flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="absolute inset-0 flex flex-col overflow-y-auto p-4"
              >
                {!summary && !isSummarizing && !summaryError && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-text-secondary)">
                    <p>Get a quick grasp of this document's contents.</p>
                    <button
                      className={primaryBtnClass}
                      onClick={() => handleGenerateSummary(true)}
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
                {isSummarizing && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-text-secondary)">
                    <Loader2 size={24} className="animate-spin text-(--color-accent)" />
                    <p>Extracting key points...</p>
                  </div>
                )}
                {summaryError && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-(--color-error)">
                    <p>{summaryError}</p>
                    <button
                      className={secondaryBtnClass}
                      onClick={() => handleGenerateSummary(true)}
                    >
                      Try Again
                    </button>
                  </div>
                )}
                {summary && (
                  <>
                    <div className="mb-2 flex justify-end">
                      <button
                        className={secondaryBtnClass}
                        onClick={() => handleGenerateSummary(true)}
                        disabled={isSummarizing}
                      >
                        Regenerate Summary
                      </button>
                    </div>
                    <div className="markdown-body pb-4 pt-2 text-[0.95rem] leading-relaxed text-(--color-text-primary)">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary}
                      </ReactMarkdown>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="absolute inset-0 flex min-w-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%),var(--color-bg-surface)]"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-[1.1rem] overflow-x-hidden overflow-y-auto p-5 max-[900px]:p-4">
                  {isChatHistoryLoading ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-(--color-border) bg-white/2 p-9 text-center text-[0.95rem] leading-relaxed text-(--color-text-secondary)">
                      <Loader2 size={24} className="animate-spin" />
                      <p>Loading previous chat for this document...</p>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-[18px] border border-dashed border-(--color-border) bg-white/2 p-9 text-center text-[0.95rem] leading-relaxed text-(--color-text-secondary)">
                      <MessageSquare size={24} />
                      <p>
                        Ask questions specifically about this file. Follow-up
                        questions in this panel will continue the same
                        document-specific chat.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`markdown-body relative min-w-0 max-w-[min(88%,720px)] overflow-wrap-anywhere rounded-2xl px-4 py-4 text-[0.93rem] leading-[1.7] shadow-[0_10px_26px_rgba(0,0,0,0.14)] before:mb-2 before:block before:text-[0.68rem] before:font-bold before:tracking-[0.08em] before:uppercase before:opacity-80 ${
                          msg.role === "user"
                            ? "self-end rounded-br-md bg-(--color-accent) text-(--message-user-text) shadow-[0_14px_34px_rgba(90,169,255,0.22)] before:content-['You'] before:text-white/80"
                            : "self-start rounded-bl-md border border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02)),var(--panel-strong-bg)] text-(--color-text-primary) [backdrop-filter:blur(10px)] before:content-['Assistant'] before:text-(--color-accent)"
                        } [&_p+p]:mt-3 [&_ul]:my-3 [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:pl-5 [&_li+li]:mt-1.5 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_code]:font-mono [&_code]:text-[0.9em] [&_blockquote]:my-3 [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-[3px] [&_blockquote]:border-l-(--color-accent) [&_blockquote]:bg-white/3 [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-(--color-text-secondary) [&_table]:my-3 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_th]:border [&_th]:border-(--color-border) [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-(--color-border) [&_td]:px-3 [&_td]:py-2 [&_td]:text-left`}
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
                    <div className="markdown-body relative flex min-w-0 max-w-[min(88%,720px)] items-center gap-2 self-start rounded-2xl rounded-bl-md border border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02)),var(--panel-strong-bg)] px-4 py-3 text-[0.93rem] italic leading-[1.7] text-(--color-text-secondary) shadow-[0_10px_26px_rgba(0,0,0,0.14)] [backdrop-filter:blur(10px)] before:mb-2 before:block before:text-[0.68rem] before:font-bold before:tracking-[0.08em] before:uppercase before:text-(--color-accent) before:opacity-80 before:content-['Assistant']">
                      <Loader2 size={14} className="animate-spin" /> Thinking...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form
                  className="flex gap-2 border-t border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent),var(--panel-soft-bg)] px-4 pb-4 pt-4"
                  onSubmit={handleSendMessage}
                >
                  <input
                    type="text"
                    placeholder="Ask about this file..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting || isChatHistoryLoading}
                    className="flex-1 rounded-[14px] border border-(--color-border) bg-(--color-bg-secondary) px-4 py-3 text-[0.9rem] text-(--color-text-primary) outline-none transition-all duration-200 placeholder:text-(--color-text-muted) focus:border-(--color-accent) focus:bg-(--color-bg-surface) focus:shadow-[0_0_0_4px_var(--color-accent-subtle)]"
                  />
                  <button
                    type="submit"
                    disabled={
                      isChatting || isChatHistoryLoading || !chatInput.trim()
                    }
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-(--color-accent) text-(--message-user-text) transition-all duration-150 hover:scale-105 hover:opacity-90 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerPage;
