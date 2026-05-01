import React, { useState, useRef, useEffect } from "react";
import { Send, Hash, Loader2, Square, Volume2, VolumeX, X } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import DocumentMentionAutocomplete, {
  type MentionedDocument,
} from "./DocumentMentionAutocomplete";
import { generateFile, resolveDocuments, searchFiles } from "../../api/client";

const DRAG_MIME_TYPE = "application/x-vrnya-doc-ref";
const PLAIN_TEXT_PREFIX = "vrnya-doc-ref:";

type DragPayload = {
  type: "vrnya/doc-ref";
  docs: Array<{
    id: string;
    name: string;
    path: string;
  }>;
  folder?: {
    name: string;
    path: string;
  };
};

type AttachmentChip = {
  id: string;
  label: string;
  mentionName: string;
  kind: "file" | "folder";
  documents: MentionedDocument[];
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasExactMention = (text: string, name: string) => {
  const pattern = new RegExp(`(^|\\s)@${escapeRegExp(name)}(?=\\s|$)`);
  return pattern.test(text);
};

interface VoiceResult {
  transcript: string;
  agentResponse: unknown;
}

interface ChatInputProps {
  onSend: (message: string, attachedDocuments?: MentionedDocument[]) => void;
  // Called when voice completes — bypasses the agent call since it already ran
  onVoiceResult?: (result: VoiceResult) => void;
  onGenerate?: (
    prompt: string,
    performGenerate: (p: string) => Promise<any>,
  ) => void;
  onStop?: () => void;
  isAutoSpeakEnabled?: boolean;
  onToggleAutoSpeak?: () => void;
  disabled: boolean;
  dockToBottom?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onVoiceResult,
  onGenerate,
  onStop,
  isAutoSpeakEnabled = false,
  onToggleAutoSpeak,
  disabled,
  dockToBottom = false,
}) => {
  const [input, setInput] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [attachmentChips, setAttachmentChips] = useState<AttachmentChip[]>([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionedDocument[]>([]);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionStartIndexRef = useRef(-1);

  const attachedDocuments = React.useMemo(() => {
    const unique = new Map<string, MentionedDocument>();
    attachmentChips.forEach((chip) => {
      chip.documents.forEach((doc) => {
        if (!unique.has(doc.id)) {
          unique.set(doc.id, doc);
        }
      });
    });
    return Array.from(unique.values());
  }, [attachmentChips]);

  // Search for documents when mention query changes
  useEffect(() => {
    const searchDocuments = async () => {
      if (!mentionQuery.trim() || mentionQuery.length < 1) {
        setMentionResults([]);
        return;
      }

      setIsMentionLoading(true);
      try {
        // Use filename search mode for @ mentions (not content search)
        const response = await searchFiles(
          mentionQuery,
          undefined,
          undefined,
          "filename",
        );

        // Handle different response formats
        if (response && typeof response === "object") {
          let items: any[] = [];

          if (Array.isArray(response)) {
            items = response;
          } else if ("items" in response && Array.isArray(response.items)) {
            items = response.items;
          } else if ("results" in response && Array.isArray(response.results)) {
            items = response.results;
          }

          const documents: MentionedDocument[] = items
            .slice(0, 8) // Limit to 8 results
            .map((item: any) => ({
              id: item.id || item.path,
              name: item.name || item.path?.split("/").pop() || "Unknown",
              path: item.path,
            }));

          setMentionResults(documents);
          setSelectedMentionIndex(0);
        }
      } catch (error) {
        console.error("Error searching files:", error);
        setMentionResults([]);
      } finally {
        setIsMentionLoading(false);
      }
    };

    const timer = setTimeout(searchDocuments, 300); // Debounce
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Detect @ mentions and update autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInput = e.target.value;
    setInput(newInput);

    // Keep attachment chips in sync with exact @mention tokens.
    // If user deletes/edits the mention in the textarea, remove the attachment.
    setAttachmentChips((prev) =>
      prev.filter((chip) => hasExactMention(newInput, chip.mentionName)),
    );

    // Check for @ mentions
    const textarea = e.target;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = newInput.substring(0, cursorPosition);

    // Find the last @ symbol
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Only show mention if @ is followed by non-space and is not part of email
      const isValidMention =
        afterAt.length > 0 &&
        !afterAt.includes(" ") &&
        !afterAt.includes("@") &&
        (lastAtIndex === 0 || /\s/.test(newInput[lastAtIndex - 1]));

      if (isValidMention) {
        mentionStartIndexRef.current = lastAtIndex;
        setMentionQuery(afterAt);
        setIsMentionOpen(true);

        // Simple position - will be positioned relative to container
        setMentionPosition({
          left: 0,
          top: 0,
        });
      } else {
        setIsMentionOpen(false);
      }
    } else {
      setIsMentionOpen(false);
    }
  };

  const handleSelectDocument = (doc: MentionedDocument) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeMention = input.substring(0, mentionStartIndexRef.current);
    const afterCursor = input.substring(cursorPosition);

    // Replace @query with selected document
    const newInput = `${beforeMention}@${doc.name} ${afterCursor}`;
    setInput(newInput);

    // Add document to attached list if not already there
    setAttachmentChips((prev) => {
      const exists = prev.some((chip) =>
        chip.documents.some((item) => item.id === doc.id),
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `file-${doc.id}`,
          label: doc.name,
          mentionName: doc.name,
          kind: "file",
          documents: [doc],
        },
      ];
    });

    // Close mention autocomplete and clear query
    setIsMentionOpen(false);
    setMentionQuery("");

    // Move cursor after the inserted mention
    setTimeout(() => {
      const newCursorPosition = beforeMention.length + doc.name.length + 2;
      if (textarea) {
        textarea.selectionStart = newCursorPosition;
        textarea.selectionEnd = newCursorPosition;
        textarea.focus();
      }
    }, 0);
  };

  const appendMentionsAndAttach = (
    docs: MentionedDocument[],
    folderMeta?: { name: string; path: string },
  ) => {
    if (!docs.length) return;

    if (folderMeta) {
      const folderChipId = `folder-${folderMeta.path}`;
      setAttachmentChips((prev) => {
        const remaining = prev.filter((chip) => chip.id !== folderChipId);
        return [
          ...remaining,
          {
            id: folderChipId,
            label: folderMeta.name,
            mentionName: folderMeta.name,
            kind: "folder",
            documents: docs,
          },
        ];
      });

      setInput((prev) => {
        const mentionToken = `@${folderMeta.name}`;
        if (hasExactMention(prev, folderMeta.name)) return prev;
        return prev.trim() ? `${prev.trim()} ${mentionToken} ` : `${mentionToken} `;
      });
      return;
    }

    docs.forEach((doc) => {
      setAttachmentChips((prev) => {
        const exists = prev.some((chip) =>
          chip.documents.some((item) => item.id === doc.id),
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            id: `file-${doc.id}`,
            label: doc.name,
            mentionName: doc.name,
            kind: "file",
            documents: [doc],
          },
        ];
      });
    });

    setInput((prev) => {
      const mentionsToAdd = docs
        .filter((doc) => !hasExactMention(prev, doc.name))
        .map((doc) => `@${doc.name}`)
        .join(" ");

      if (!mentionsToAdd) return prev;
      return prev.trim() ? `${prev.trim()} ${mentionsToAdd} ` : `${mentionsToAdd} `;
    });
  };

  const handleDropToComposer = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    try {
      const directPayload = event.dataTransfer.getData(DRAG_MIME_TYPE);
      const plainPayload = event.dataTransfer.getData("text/plain");
      const payloadRaw = directPayload
        ? directPayload
        : plainPayload.startsWith(PLAIN_TEXT_PREFIX)
          ? plainPayload.slice(PLAIN_TEXT_PREFIX.length)
          : "";

      if (!payloadRaw) return;

      const payload = JSON.parse(payloadRaw) as DragPayload;
      if (payload.type !== "vrnya/doc-ref" || !Array.isArray(payload.docs)) {
        return;
      }

      const ids = payload.docs
        .map((doc) => doc.id)
        .filter((id): id is string => Boolean(id));
      if (!ids.length) return;

      const resolved = await resolveDocuments(ids);
      const resolvedDocs: MentionedDocument[] = resolved.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        path: doc.path,
      }));

      appendMentionsAndAttach(resolvedDocs, payload.folder);
    } catch (error) {
      console.error("Failed to process dropped document reference:", error);
    }
  };

  const handleComposerDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (
      event.dataTransfer.types.includes(DRAG_MIME_TYPE) ||
      event.dataTransfer.types.includes("text/plain")
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleRemoveAttachment = (chipId: string) => {
    const chip = attachmentChips.find((item) => item.id === chipId);
    if (!chip) return;

    setAttachmentChips((prev) => prev.filter((item) => item.id !== chipId));

    const tokenRegex = new RegExp(
      `(^|\\s)@${escapeRegExp(chip.mentionName)}(?=\\s|$)\\s*`,
      "g",
    );
    setInput((prev) => prev.replace(tokenRegex, " ").replace(/\s{2,}/g, " ").trimStart());
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      if (input.trim().startsWith("/generate ")) {
        if (onGenerate) {
          onGenerate(input.replace("/generate", "").trim(), generateFile);
        }
      } else {
        onSend(input.trim(), attachedDocuments);
      }
      setInput("");
      setAttachmentChips([]);
    }
  };

  const handleVoiceRecording = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Check for generation intent in voice
    const lowerTranscript = transcript.toLowerCase();
    if (
      lowerTranscript.startsWith("generate ") ||
      lowerTranscript.startsWith("make a file ")
    ) {
      const prompt = transcript
        .replace(/^(generate|make a file)\s+/i, "")
        .trim();
      if (onGenerate) {
        onGenerate(prompt, generateFile);
        return;
      }
    }

    // Normal voice input -> Send immediately (Instant Mode)
    onSend(transcript, attachedDocuments);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle mention autocomplete keys
    if (isMentionOpen && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % mentionResults.length);
        return;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex(
          (prev) => (prev - 1 + mentionResults.length) % mentionResults.length,
        );
        return;
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsMentionOpen(false);
        return;
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelectDocument(mentionResults[selectedMentionIndex]);
        return;
      }
    }

    // Cursor-style atomic backspace for inserted @mentions:
    // pressing backspace right after "@FileName " removes whole token + chip.
    if (e.key === "Backspace" && textareaRef.current) {
      const textarea = textareaRef.current;
      const cursor = textarea.selectionStart;
      const beforeCursor = input.slice(0, cursor);

      for (const chip of attachmentChips) {
        const tokenWithSpace = `@${chip.mentionName} `;
        const token = `@${chip.mentionName}`;
        if (
          beforeCursor.endsWith(tokenWithSpace) ||
          beforeCursor.endsWith(token)
        ) {
          e.preventDefault();
          const matchedToken = beforeCursor.endsWith(tokenWithSpace)
            ? tokenWithSpace
            : token;
          const start = cursor - matchedToken.length;
          const nextInput = `${input.slice(0, start)}${input.slice(cursor)}`;

          setInput(nextInput);
          setAttachmentChips((prev) =>
            prev.filter((attached) => attached.id !== chip.id),
          );

          setTimeout(() => {
            textarea.selectionStart = start;
            textarea.selectionEnd = start;
          }, 0);
          return;
        }
      }
    }

    // Normal enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 px-4 pb-[5px] transition-all duration-300 md:px-6 ${
        dockToBottom ? "mt-auto" : "mt-6"
      }`}
    >
      {/* Attached Documents Display */}
      {attachmentChips.length > 0 && (
        <div className="mx-auto w-full max-w-[1048px]">
          <div className="flex flex-wrap gap-2">
            {attachmentChips.map((chip) => (
              <div
                key={chip.id}
                className="flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-1.5 text-sm text-white shadow-[0_6px_16px_rgba(59,130,246,0.32)]"
              >
                <span className="font-medium">
                  {chip.label}
                  {chip.kind === "folder" ? " (folder)" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(chip.id)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto mt-[10px] flex w-full max-w-[1048px] flex-col gap-1">
      {/* Main Input Area */}
      <div
        className="glass relative flex w-full items-end gap-3 rounded-[16px] border border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012)),var(--color-bg-surface)] px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition-all duration-300 focus-within:-translate-y-px focus-within:border-(--color-accent) focus-within:shadow-(--shadow-accent)"
        onDragOver={handleComposerDragOver}
        onDrop={(e) => void handleDropToComposer(e)}
      >
        <div className="flex h-10 items-center text-(--color-text-muted)">
          {isProcessingVoice ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Hash size={18} />
          )}
        </div>

        {/* Document Mention Autocomplete */}
        <DocumentMentionAutocomplete
          isOpen={isMentionOpen}
          searchQuery={mentionQuery}
          results={mentionResults}
          selectedIndex={selectedMentionIndex}
          isLoading={isMentionLoading}
          onSelectDocument={handleSelectDocument}
        />
        <textarea
          ref={textareaRef}
          aria-label="Message input"
          rows={1}
          placeholder={
            isProcessingVoice
              ? "Processing voice..."
              : "Type a message or ask about a file... (use @filename to add context)"
          }
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isProcessingVoice}
          className="max-h-[200px] min-w-0 flex-1 resize-none border-0 bg-transparent py-2 font-sans text-[0.8125rem] leading-relaxed text-(--color-text-primary) outline-none placeholder:text-(--color-text-muted)"
        />
        <div className="flex items-center gap-2 pr-2">
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            disabled={disabled || isProcessingVoice}
          />
          <button
            className={`flex items-center justify-center rounded-full border-0 bg-transparent p-1 transition-all duration-200 hover:scale-110 hover:bg-(--panel-strong-bg) ${
              isAutoSpeakEnabled
                ? "text-(--color-accent) drop-shadow-[0_0_4px_var(--color-accent)]"
                : "text-(--color-text-muted)"
            }`}
            onClick={onToggleAutoSpeak}
            title={
              isAutoSpeakEnabled ? "Disable auto-speak" : "Enable auto-speak"
            }
            type="button"
            aria-label={
              isAutoSpeakEnabled ? "Disable auto-speak" : "Enable auto-speak"
            }
          >
            {isAutoSpeakEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {disabled && onStop ? (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-red-500/15 text-red-500 transition-colors duration-200 hover:bg-red-500/30"
              onClick={onStop}
              title="Stop generation"
              type="button"
              aria-label="Stop generation"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              className={`flex items-center justify-center rounded-full border-0 p-2 transition-all duration-200 ${
                input.trim() && !disabled && !isProcessingVoice
                  ? "text-blue-500 hover:-translate-y-0.5 hover:text-blue-600"
                  : "text-(--color-text-muted)"
              } hover:scale-105 hover:bg-(--panel-strong-bg) disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={handleSend}
              disabled={!input.trim() || disabled || isProcessingVoice}
              type="button"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="flex w-full flex-wrap justify-center gap-4 text-[10px] tracking-[0.05em] text-(--color-text-muted) uppercase md:gap-6">
        <span>
          <b className="text-(--color-text-secondary)">Shift + Enter</b> for new
          line
        </span>
        <span>
          <b className="text-(--color-text-secondary)">Enter</b> to send
        </span>
      </div>
      </div>
    </div>
  );
};

export default ChatInput;
