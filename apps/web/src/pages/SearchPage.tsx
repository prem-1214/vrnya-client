import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, Sparkles } from "lucide-react";
import { searchFiles } from "../api/client";
import type { SearchResult } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { openPathInShell } from "../platform/shell";
import "./SearchPage.css";

function getSnippet(content: string, query: string, maxLength = 200): string {
  const lower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter((w) => w.length >= 3);

  let matchIndex = -1;
  for (const word of words) {
    const idx = lower.indexOf(word);
    if (idx !== -1) {
      matchIndex = idx;
      break;
    }
  }
  if (matchIndex === -1) matchIndex = lower.indexOf(queryLower);
  if (matchIndex === -1) {
    return (
      content.slice(0, maxLength) + (content.length > maxLength ? "..." : "")
    );
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(content.length, start + maxLength);
  const snippet = content.slice(start, end);
  return `${start > 0 ? "..." : ""}${snippet}${end < content.length ? "..." : ""}`;
}

function highlightMatches(text: string, query: string): React.ReactNode[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  if (words.length === 0) return [text];

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, idx) =>
    words.some((w) => part.toLowerCase() === w) ? (
      <mark key={idx} className="search-highlight">
        {part}
      </mark>
    ) : (
      <span key={idx}>{part}</span>
    ),
  );
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);
  const navigate = useNavigate();

  const FILE_TYPE_FILTERS = [
    { label: "All", extensions: [] as string[] },
    { label: "PDF", extensions: [".pdf"] },
    { label: "Text", extensions: [".txt"] },
    { label: "Markdown", extensions: [".md"] },
    { label: "JSON", extensions: [".json"] },
    { label: "Code", extensions: [".js", ".ts", ".html", ".css"] },
    { label: "Docs", extensions: [".docx"] },
  ] as const;

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const filterExts = FILE_TYPE_FILTERS[activeFilter].extensions;
        const data = await searchFiles(
          query,
          filterExts.length > 0 ? [...filterExts] : undefined,
        );
        setResults(data.results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [query, activeFilter]);

  const handleOpenResult = (result: SearchResult) => {
    if (!result.id) {
      if (result.path) {
        void openPathInShell(result.path);
      }
      return;
    }

    // Pass the matched chunk text as navigation state so DocumentViewerPage
    // can scroll to and highlight that exact section.
    navigate(`/document/${result.id}`, {
      state: {
        highlightText: result.content,
        query,
      },
    });
  };

  return (
    <div className="search-page">
      <header className="page-header glass">
        <div className="header-info">
          <h1>Semantic Search</h1>
          <span>
            Search indexed files by meaning, then open them in the document
            viewer
          </span>
        </div>
      </header>

      <div className="search-container">
        <div className="search-input-box glass">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search across all indexed files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading && <div className="loader-small" />}
        </div>

        <div className="filter-chips">
          {FILE_TYPE_FILTERS.map((filter, idx) => (
            <button
              key={filter.label}
              className={`filter-chip ${activeFilter === idx ? "active" : ""}`}
              onClick={() => setActiveFilter(idx)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="search-results">
          <AnimatePresence>
            {results.length > 0 ? (
              results.map((result: SearchResult, idx: number) => (
                <motion.div
                  key={`${result.id}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="result-card glass"
                  onClick={() => handleOpenResult(result)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="result-header">
                    <div className="result-file-info">
                      <span className="result-file-name">
                        {result.name || "unknown"}
                      </span>
                      <span className="result-file-path">
                        {result.path || ""}
                      </span>
                    </div>
                    <div className="similarity-badge">
                      {(result.similarity * 100).toFixed(0)}% Match
                    </div>
                  </div>
                  <div className="result-content">
                    <p>
                      {highlightMatches(
                        getSnippet(result.content, query),
                        query,
                      )}
                    </p>
                  </div>
                  <div
                    className="result-footer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Info size={12} />
                      <span>Click to open at matching section</span>
                    </div>
                    {result.id && (
                      <button
                        className="ai-action-btn"
                        title="Ask AI about this file"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/document/${result.id}`);
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent)",
                          cursor: "pointer",
                          padding: "4px 8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          borderRadius: "4px",
                        }}
                      >
                        <Sparkles size={14} />
                        <span style={{ fontSize: "12px" }}>AI View</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : query.trim() && !isLoading ? (
              <div className="no-results">
                <p>No matches found for "{query}"</p>
                <span>
                  Try indexing more folders or rephrasing your search.
                </span>
              </div>
            ) : (
              !query.trim() && (
                <div className="search-placeholder">
                  <Search size={48} />
                  <p>Start typing to search your brain</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
