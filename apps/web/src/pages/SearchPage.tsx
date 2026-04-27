import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Info, Sparkles, X } from "lucide-react";
import { searchFiles, getImageDownloadUrl } from "../api/client";
import type { SearchResult } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { openPathInShell } from "../platform/shell";
import PageShell from "../components/layout/PageShell";
import { useMotionSettings } from "../lib/motion";

const FILE_TYPE_FILTERS = [
  { label: "All", extensions: [] as string[] },
  { label: "Images", extensions: [] as string[], type: "image" as const },
  { label: "PDF", extensions: [".pdf"] },
  { label: "Text", extensions: [".txt"] },
  { label: "Markdown", extensions: [".md"] },
  { label: "JSON", extensions: [".json"] },
  { label: "Code", extensions: [".js", ".ts", ".html", ".css"] },
  { label: "Docs", extensions: [".docx"] },
] as const;

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
  const [imagePreview, setImagePreview] = useState<{
    url: string;
    caption: string;
    name: string;
  } | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { reduceMotion, itemTransition, fadeSlide } = useMotionSettings();
  const filterChipClass = (isActive: boolean) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 text-[0.8rem] transition-all duration-150 ${
      isActive
        ? "border-(--color-accent) bg-(--color-accent) font-semibold text-white"
        : "border-(--color-border) bg-transparent font-medium text-(--color-text-secondary) hover:border-(--color-accent) hover:text-(--color-text-primary)"
    }`;

  // Load image URLs for grid display
  useEffect(() => {
    const loadImageUrls = async () => {
      const newUrls: Record<string, string> = {};

      for (const result of results) {
        if (result.isImage && result.id && !imageUrls[result.id]) {
          try {
            const { downloadUrl } = await getImageDownloadUrl(result.id);
            newUrls[result.id] = downloadUrl;
          } catch (error) {
            console.error(`Failed to load image URL for ${result.id}:`, error);
          }
        }
      }

      if (Object.keys(newUrls).length > 0) {
        setImageUrls((prev) => ({ ...prev, ...newUrls }));
      }
    };

    if (results.length > 0) {
      loadImageUrls();
    }
  }, [results]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const filterObj = FILE_TYPE_FILTERS[activeFilter];
        const filterExts = filterObj.extensions;
        const data = await searchFiles(
          query,
          filterExts.length > 0 ? [...filterExts] : undefined,
          // @ts-ignore - The type property is only on the Images filter
          filterObj.type,
        );
        // Merge results and images only when:
        // 1. "All" filter is selected (activeFilter === 0)
        // 2. "Images" filter is selected (activeFilter === 1)
        const allResults = [...(data.results || [])];
        if ((activeFilter === 0 || activeFilter === 1) && data.images) {
          allResults.push(...data.images);
        }
        setResults(allResults);
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

    navigate(`/document/${result.id}`, {
      state: {
        highlightText: result.content,
        query,
      },
    });
  };

  const handleImagePreview = async (result: SearchResult) => {
    if (!result.id) return;
    try {
      const { downloadUrl } = await getImageDownloadUrl(result.id);
      setImagePreview({
        url: downloadUrl,
        caption: result.content,
        name: result.name || "Image",
      });
    } catch (error) {
      console.error("Failed to load image preview:", error);
    }
  };

  return (
    <PageShell
      title="Semantic Search"
      subtitle="Search indexed files by meaning, then open them in the document viewer"
      contentClassName="flex min-h-full flex-col gap-8 p-8"
    >
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

      <div className="mx-auto w-full max-w-[1200px]">
        <AnimatePresence>
          {/* Unified Grid for Images and Documents */}
          {results.length > 0 && (
            <motion.div
              key="results-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
            >
              {results.map((result: SearchResult, idx: number) => (
                <motion.button
                  key={`${result.id}-${idx}`}
                  variants={fadeSlide(10)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={itemTransition(idx)}
                  className="flex min-h-64 cursor-pointer flex-col gap-3 rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-4 text-left shadow-(--shadow-sm) transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(90,169,255,0.28)] hover:bg-(--color-bg-hover) hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)]"
                  onClick={() =>
                    result.isImage
                      ? handleImagePreview(result)
                      : handleOpenResult(result)
                  }
                  type="button"
                  aria-label={`${result.isImage ? "Preview image" : "Open document"} ${result.name || "result"}`}
                >
                  {/* Header with badge and similarity */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 rounded-sm bg-(--color-accent) px-1.5 py-0.5 text-[10px] font-bold text-black uppercase leading-tight">
                      {result.isImage ? "IMAGE" : "FILE"}
                    </span>
                    <div className="shrink-0 rounded-full bg-(--color-accent-subtle) px-1.5 py-0.5 text-[9px] font-bold text-(--color-accent) uppercase">
                      {(result.similarity * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Content Preview Area */}
                  {result.isImage ? (
                    /* Image Preview */
                    <div className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-(--glass-border)">
                      {imageUrls[result.id || ""] ? (
                        <img
                          src={imageUrls[result.id || ""]}
                          alt={result.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(90,169,255,0.1),rgba(168,85,247,0.1))]">
                          <div className="text-2xl opacity-40">🖼️</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Document Preview */
                    <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                      <div className="min-w-0">
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-(--color-text-primary)">
                          {result.name || "Untitled"}
                        </span>
                        <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-(--color-text-secondary)">
                          {result.path || ""}
                        </span>
                      </div>
                      <p className="line-clamp-3 flex-1 text-xs leading-5 text-(--color-text-secondary)">
                        {highlightMatches(
                          getSnippet(result.content, query),
                          query,
                        )}
                      </p>
                    </div>
                  )}

                  {/* Footer with name/action */}
                  <div className="border-t border-(--glass-border) pt-2">
                    {result.isImage ? (
                      <div className="line-clamp-2 text-center text-[12px] font-medium text-(--color-text-primary)">
                        {result.name}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-(--color-text-muted) flex items-center gap-1">
                            <Info size={10} />
                            Click to open
                          </span>
                        </div>
                        {result.id && (
                          <div
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded border-0 bg-transparent px-1 py-0.5 text-[9px] text-(--color-accent) hover:text-(--color-accent) transition-colors"
                            role="button"
                            tabIndex={0}
                            aria-label="Open AI view"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/document/${result.id}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                navigate(`/document/${result.id}`);
                              }
                            }}
                          >
                            <Sparkles size={12} />
                            <span>AI</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {query.trim() && results.length === 0 && !isLoading ? (
            <div className="rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-12 text-center text-(--color-text-muted) shadow-(--shadow-sm)">
              <p className="mb-1">No matches found for "{query}"</p>
              <span className="text-sm">
                Try indexing more folders or rephrasing your search.
              </span>
            </div>
          ) : null}

          {!query.trim() && (
            <div className="rounded-lg border border-(--glass-border) bg-(--color-bg-surface) p-12 text-center text-(--color-text-muted) shadow-(--shadow-sm)">
              <Search
                size={48}
                className={`mb-4 inline opacity-20 ${reduceMotion ? "" : "transition-transform duration-300"}`}
              />
              <p>Start typing to search your brain</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setImagePreview(null)}
          >
            <motion.div
              className="relative max-h-[90vh] max-w-[90%] overflow-hidden rounded-lg border border-(--glass-border) bg-(--color-bg-surface) shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <button
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-all hover:bg-black/80 hover:scale-110"
                onClick={() => setImagePreview(null)}
                type="button"
                aria-label="Close image preview"
              >
                <X size={24} />
              </button>
              <img
                src={imagePreview.url}
                alt={imagePreview.name}
                className="max-h-[70vh] max-w-full object-contain bg-black/20"
              />
              <div className="border-t border-(--glass-border) p-4">
                <h3 className="text-sm font-semibold text-(--color-text-primary)">
                  {imagePreview.name}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
};

export default SearchPage;
