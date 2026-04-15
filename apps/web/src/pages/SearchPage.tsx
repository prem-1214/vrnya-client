import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, Sparkles } from "lucide-react";
import { searchFiles } from "../api/client";
import type { SearchResult } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { openPathInShell } from "../platform/shell";

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
      <mark
        key={idx}
        className="rounded-[3px] bg-[rgba(139,92,246,0.25)] px-[3px] py-px font-semibold text-(--color-accent)"
      >
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
  const filterChipClass = (isActive: boolean) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-all duration-150 ${
      isActive
        ? "border-(--color-accent) bg-(--color-accent) font-semibold text-white"
        : "border-(--color-border) bg-transparent font-medium text-(--color-text-secondary) hover:border-(--color-accent) hover:text-(--color-text-primary)"
    }`;

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
    <div className="flex h-full flex-col">
      <header className="z-10 flex items-center justify-between rounded-t-xl border-b border-(--glass-border) bg-(--header-bg) px-8 py-4 [backdrop-filter:var(--glass-blur)] [-webkit-backdrop-filter:var(--glass-blur)]">
        <div>
          <h1 className="text-md font-bold text-(--color-text-primary)">
            Semantic Search
          </h1>
          <span className="text-xs text-(--color-text-muted)">
            Search indexed files by meaning, then open them in the document
            viewer
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-[800px] items-center gap-4 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) px-6 py-4 shadow-(--shadow-sm) transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-(--color-accent) focus-within:shadow-(--shadow-accent)">
          <Search className="text-(--color-text-muted)" size={20} />
          <input
            type="text"
            placeholder="Search across all indexed files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 border-0 bg-transparent font-sans text-md text-(--color-text-primary) outline-none"
          />
          {isLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-accent-subtle) border-t-(--color-accent)" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILE_TYPE_FILTERS.map((filter, idx) => (
            <button
              key={filter.label}
              className={filterChipClass(activeFilter === idx)}
              onClick={() => setActiveFilter(idx)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mx-auto grid w-full max-w-[1000px] grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
          <AnimatePresence>
            {results.length > 0 ? (
              results.map((result: SearchResult, idx: number) => (
                <motion.div
                  key={`${result.id}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex min-h-40 cursor-pointer flex-col gap-4 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-4 shadow-(--shadow-sm) transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(90,169,255,0.28)] hover:bg-(--color-bg-hover) hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                  onClick={() => handleOpenResult(result)}
                >
                  <div className="flex items-start justify-between gap-3 overflow-hidden">
                    <div className="min-w-0 flex-1">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.95rem] font-semibold text-(--color-text-primary)">
                        {result.name || "unknown"}
                      </span>
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--color-text-secondary)">
                        {result.path || ""}
                      </span>
                    </div>
                    <div className="shrink-0 whitespace-nowrap rounded-full bg-(--color-accent-subtle) px-2 py-0.5 text-[10px] font-bold text-(--color-accent) uppercase">
                      {(result.similarity * 100).toFixed(0)}% Match
                    </div>
                  </div>
                  <div className="line-clamp-4 flex-1 text-sm leading-6 text-(--color-text-secondary)">
                    <p className="m-0">
                      {highlightMatches(
                        getSnippet(result.content, query),
                        query,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-(--glass-border) pt-2 text-[10px] text-(--color-text-muted)">
                    <div className="flex items-center gap-1">
                      <Info size={12} />
                      <span>Click to open at matching section</span>
                    </div>
                    {result.id && (
                      <button
                        className="flex cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-2 py-1 text-xs text-(--color-accent)"
                        title="Ask AI about this file"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/document/${result.id}`);
                        }}
                      >
                        <Sparkles size={14} />
                        <span className="text-xs">AI View</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            ) : query.trim() && !isLoading ? (
              <div className="col-span-full p-12 text-center text-(--color-text-muted)">
                <p className="mb-1">No matches found for "{query}"</p>
                <span className="text-sm">
                  Try indexing more folders or rephrasing your search.
                </span>
              </div>
            ) : (
              !query.trim() && (
                <div className="col-span-full p-12 text-center text-(--color-text-muted)">
                  <Search size={48} className="mb-4 inline opacity-20" />
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
