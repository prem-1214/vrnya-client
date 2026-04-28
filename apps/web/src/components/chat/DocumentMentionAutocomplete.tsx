import React from "react";
import { FileText, Loader2 } from "lucide-react";

export interface MentionedDocument {
  id: string;
  name: string;
  path: string;
}

interface DocumentMentionAutocompleteProps {
  isOpen: boolean;
  searchQuery: string;
  results: MentionedDocument[];
  selectedIndex: number;
  isLoading?: boolean;
  onSelectDocument: (doc: MentionedDocument) => void;
}

const DocumentMentionAutocomplete: React.FC<
  DocumentMentionAutocompleteProps
> = ({
  isOpen,
  searchQuery,
  results,
  selectedIndex,
  isLoading = false,
  onSelectDocument,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 min-w-[280px] max-w-[400px] rounded-lg border border-(--color-border) bg-(--color-bg-surface) shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-3 text-(--color-text-muted)">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Searching files...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="px-4 py-3 text-sm text-(--color-text-muted)">
          {searchQuery.trim() ? "No files found" : "Type to search files"}
        </div>
      ) : (
        <ul className="max-h-[280px] overflow-y-auto">
          {results.map((doc, index) => (
            <li key={doc.id || index}>
              <button
                type="button"
                onClick={() => onSelectDocument(doc)}
                className={`w-full px-4 py-2 text-left transition-colors duration-150 flex items-start gap-3 ${
                  index === selectedIndex
                    ? "bg-(--color-accent) bg-opacity-20 text-(--color-accent)"
                    : "hover:bg-(--panel-soft-bg) text-(--color-text-primary)"
                }`}
              >
                <FileText size={16} className="shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{doc.name}</div>
                  <div className="text-xs text-(--color-text-muted) truncate">
                    {doc.path}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentMentionAutocomplete;
