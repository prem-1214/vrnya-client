import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import type { AgentSource, Message } from "../../hooks/useChat";
import MessageSourceList from "./MessageSourceList";
import { openPathInShell, showPathInFolder } from "../../platform/shell";
import "./MessageBubble.css";

interface MessageBubbleProps {
  message: Message;
  onOpenPreview?: (target: AgentSource | { path: string }) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onOpenPreview,
}) => {
  const isUser = message.role === "user";

  // Sources and action path now come from structured message fields,
  // not from @@ACTION: markers embedded in content strings.
  const sources = message.sources ?? [];
  const actionPath = message.actionPath;

  const fullDisplayContent = message.content
    .replace(/@@ACTION:.*?@@/g, "")
    .trim();
  const [visibleContent, setVisibleContent] = useState(
    isUser ? fullDisplayContent : "",
  );

  const shouldAnimate = useMemo(() => {
    if (isUser) return false;
    if (!fullDisplayContent) return false;
    return fullDisplayContent.length > 180;
  }, [fullDisplayContent, isUser]);

  useEffect(() => {
    if (!shouldAnimate) {
      // setVisibleContent(fullDisplayContent);
      return;
    }

    let index = 0;
    const step = 28;
    const intervalMs = 18;

    // setVisibleContent("");

    const timer = window.setInterval(() => {
      index = Math.min(index + step, fullDisplayContent.length);
      setVisibleContent(fullDisplayContent.slice(0, index));
      if (index >= fullDisplayContent.length) {
        window.clearInterval(timer);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [fullDisplayContent, shouldAnimate]);

  const displayContent = shouldAnimate ? visibleContent : fullDisplayContent;
  const revealComplete = displayContent.length >= fullDisplayContent.length;

  const handleOpen = async (target: AgentSource | { path: string } | string) => {
    const previewTarget =
      typeof target === "string" ? { path: target } : target;

    if (onOpenPreview) {
      onOpenPreview(previewTarget);
      return;
    }
    try {
      const error = await openPathInShell(previewTarget.path);
      if (error) {
        alert(`Could not open file: ${error}\nPath: ${previewTarget.path}`);
      }
    } catch (err) {
      alert(`Error calling openPath: ${err}`);
    }
  };

  const handleShowInFolder = async (path: string) => {
    try {
      const error = await showPathInFolder(path);
      if (error) alert(`Could not show folder: ${error}\nPath: ${path}`);
    } catch (err) {
      alert(`Error calling showInFolder: ${err}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`message-bubble-row ${isUser ? "user" : "assistant"}`}
    >
      <div className={`message-bubble ${isUser ? "user" : "assistant"} glass`}>
        <div className="message-header">
          <span className="message-role">{isUser ? "You" : "Assistant"}</span>
          <span className="message-time">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="message-content prose">
          {message.fileDetails ? (
            <div className="generated-file-card">
              <strong style={{ display: "block", marginBottom: 10 }}>📄 {message.fileDetails.filename}</strong>
              <pre
                style={{
                  maxHeight: 200,
                  overflow: "auto",
                  padding: 10,
                  borderRadius: 6,
                  fontSize: 12,
                  marginBottom: 10,
                  background: "var(--panel-strong-bg)"
                }}
              >
                {message.fileDetails.preview}
              </pre>
              <button 
                className="action-btn"
                onClick={() => window.open(message.fileDetails!.url)}
              >
                Download File
              </button>
            </div>
          ) : (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
              {shouldAnimate && !revealComplete && (
                <span className="message-cursor" aria-hidden="true" />
              )}
            </>
          )}
        </div>

        {/* File operation result — single action path (create, rename, etc.) */}
        {actionPath && revealComplete && sources.length === 0 && (
          <div className="message-actions-container">
            <div className="message-action-item">
              <span className="action-label" title={actionPath}>
                {actionPath.split(/[/\\]/).pop()}
              </span>
              <div className="message-actions">
                <button
                  className="action-btn"
                  onClick={() => handleOpen({ path: actionPath })}
                >
                  Preview
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleShowInFolder(actionPath)}
                >
                  Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File-backed answer sources — search results with attribution */}
        {sources.length > 0 && revealComplete && (
          <MessageSourceList sources={sources} onOpenPreview={handleOpen} />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
