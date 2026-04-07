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
  getR2DownloadUrl,
  BASE_URL,
} from "../api/client";
import "./DocumentViewerPage.css";

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
    return <pre className="raw-text-content">{content}</pre>;
  }

  const [before, match, after] = parts;

  return (
    <pre className="raw-text-content">
      {before}
      <mark ref={highlightRef} className="doc-chunk-highlight">
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

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [isDocxLoading, setIsDocxLoading] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  // Ref attached to the highlighted chunk — used for scrolling
  const highlightRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      setIsLoading(true);
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
      window.document.body.classList.remove("is-resizing");
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.document.body.style.cursor = "col-resize";
      window.document.body.style.userSelect = "none";
      window.document.body.classList.add("is-resizing");
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
      docx.renderAsync(docxBuffer, docxContainerRef.current, undefined, {
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

    return <pre className="raw-text-content">{document.content}</pre>;
  }

  // ─── Loading / error states ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="doc-viewer-loading">
        <Loader2 size={32} className="spin accent-text" />
        <p>Loading document context...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="doc-viewer-error">
        <AlertCircle size={32} />
        <h2>Failed to open document</h2>
        <p>{error}</p>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="doc-viewer-layout">
      {/* LEFT PANE: Document Content */}
      <div className="doc-viewer-main glass">
        <header className="doc-viewer-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="doc-viewer-title">
            <File size={16} className="file-icon" />
            <h2>{document.name}</h2>
            <span className="doc-path">{document.path}</span>
          </div>
        </header>

        {document.isTruncated && document.extension !== ".pdf" && (
          <div
            className="truncation-warning"
            style={{
              background: "rgba(255, 170, 0, 0.1)",
              borderBottom: "1px solid rgba(255, 170, 0, 0.3)",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#ffaa00",
              fontSize: "0.85rem",
            }}
          >
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
          <div
            style={{
              background: "rgba(255, 200, 0, 0.08)",
              borderBottom: "1px solid rgba(255, 200, 0, 0.2)",
              padding: "0.5rem 1rem",
              fontSize: "0.8rem",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>↓ Scrolled to matching section</span>
          </div>
        )}

        <div
          className="doc-content-area"
          style={{ padding: document.extension === ".pdf" ? 0 : undefined }}
        >
          {renderDocumentContent()}
        </div>
      </div>

      {/* DRAG DIVIDER */}
      <div
        className={`resizer ${isResizing ? "resizing" : ""}`}
        onMouseDown={startResizing}
        data-testid="resizer"
      >
        <div className="resizer-handle" />
      </div>

      {/* RIGHT PANE: Intelligence Sidebar */}
      <div
        className="doc-viewer-sidebar glass"
        style={{ width: `${sidebarWidth}px`, flex: "none" }}
      >
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === "summary" ? "active" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText size={14} /> Summary
          </button>
          <button
            className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={14} /> Chat
          </button>
        </div>

        <div className="sidebar-content">
          <AnimatePresence mode="wait">
            {activeTab === "summary" ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className="sidebar-pane summary-pane"
              >
                {!summary && !isSummarizing && !summaryError && (
                  <div className="sidebar-center">
                    <p>Get a quick grasp of this document's contents.</p>
                    <button
                      className="btn-primary"
                      onClick={() => handleGenerateSummary(true)}
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
                {isSummarizing && (
                  <div className="sidebar-center">
                    <Loader2 size={24} className="spin accent-text" />
                    <p>Extracting key points...</p>
                  </div>
                )}
                {summaryError && (
                  <div className="sidebar-center error">
                    <p>{summaryError}</p>
                    <button
                      className="btn-secondary"
                      onClick={() => handleGenerateSummary(true)}
                    >
                      Try Again
                    </button>
                  </div>
                )}
                {summary && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <button
                        className="btn-secondary"
                        onClick={() => handleGenerateSummary(true)}
                        disabled={isSummarizing}
                      >
                        Regenerate Summary
                      </button>
                    </div>
                    <div className="summary-result markdown-body">
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
                className="sidebar-pane chat-pane"
              >
                <div className="chat-messages">
                  {chatMessages.length === 0 ? (
                    <div className="chat-empty">
                      <MessageSquare size={24} />
                      <p>
                        Ask questions specifically about this file. The AI's
                        context is strictly locked to this document.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`chat-bubble ${msg.role} markdown-body`}
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
                    <div className="chat-bubble ai pending">
                      <Loader2 size={14} className="spin" /> Thinking...
                    </div>
                  )}
                </div>
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Ask about this file..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
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
