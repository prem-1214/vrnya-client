import React, { useState, useRef, useEffect } from "react";
import { Send, Hash, Loader2, Square, Volume2, VolumeX, X } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import DocumentMentionAutocomplete, {
  type MentionedDocument,
} from "./DocumentMentionAutocomplete";
import { generateFile, searchFiles } from "../../api/client";

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
  const [attachedDocuments, setAttachedDocuments] = useState<
    MentionedDocument[]
  >([]);
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
    setAttachedDocuments((prev) => {
      const exists = prev.some((d) => d.path === doc.path);
      return exists ? prev : [...prev, doc];
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

  const handleRemoveDocument = (docPath: string) => {
    setAttachedDocuments((prev) => prev.filter((d) => d.path !== docPath));

    // Also remove the @name from input
    const docName = attachedDocuments.find((d) => d.path === docPath)?.name;
    if (docName) {
      setInput((prev) => prev.replace(new RegExp(`@${docName}\\s*`), ""));
    }
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
      setAttachedDocuments([]);
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

    // Normal enter to send
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 px-4 pb-4 transition-all duration-300 md:px-6 md:pb-6 ${
        dockToBottom ? "mt-auto" : "mt-6"
      }`}
    >
      {/* Attached Documents Display */}
      {attachedDocuments.length > 0 && (
        <div className="mx-auto w-full max-w-[920px]">
          <div className="flex flex-wrap gap-2">
            {attachedDocuments.map((doc) => (
              <div
                key={doc.path}
                className="flex items-center gap-2 rounded-lg bg-(--color-accent) bg-opacity-15 px-3 py-1.5 text-(--color-accent) text-sm"
              >
                <span className="font-medium">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(doc.path)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${doc.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="glass mx-auto flex w-full max-w-[920px] items-end gap-4 rounded-[18px] border border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012)),var(--color-bg-surface)] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition-all duration-300 focus-within:-translate-y-px focus-within:border-(--color-accent) focus-within:shadow-(--shadow-accent) relative">
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
          className="max-h-[200px] min-w-0 flex-1 resize-none border-0 bg-transparent py-2.5 font-sans text-sm leading-relaxed text-(--color-text-primary) outline-none placeholder:text-(--color-text-muted)"
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
      <div className="mx-auto flex w-full max-w-[920px] flex-wrap justify-center gap-4 text-[10px] tracking-[0.05em] text-(--color-text-muted) uppercase md:gap-6">
        <span>
          <b className="text-(--color-text-secondary)">Shift + Enter</b> for new
          line
        </span>
        <span>
          <b className="text-(--color-text-secondary)">Enter</b> to send
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
