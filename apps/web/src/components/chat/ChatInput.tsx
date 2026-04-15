import React, { useState, useRef, useEffect } from "react";
import { Send, Hash, Loader2, Square, Volume2, VolumeX } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import { generateFile } from "../../api/client";

interface VoiceResult {
  transcript: string;
  agentResponse: unknown;
}

interface ChatInputProps {
  onSend: (message: string) => void;
  // Called when voice completes — bypasses the agent call since it already ran
  onVoiceResult?: (result: VoiceResult) => void;
  onGenerate?: (prompt: string, performGenerate: (p: string) => Promise<any>) => void;
  onStop?: () => void;
  isAutoSpeakEnabled?: boolean;
  onToggleAutoSpeak?: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onVoiceResult,
  onGenerate,
  onStop,
  isAutoSpeakEnabled = false,
  onToggleAutoSpeak,
  disabled,
}) => {
  const [input, setInput] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      if (input.trim().startsWith("/generate ")) {
        if (onGenerate) {
          onGenerate(input.replace("/generate", "").trim(), generateFile);
        }
      } else {
        onSend(input.trim());
      }
      setInput("");
    }
  };

  const handleVoiceRecording = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    // Check for generation intent in voice
    const lowerTranscript = transcript.toLowerCase();
    if (lowerTranscript.startsWith("generate ") || lowerTranscript.startsWith("make a file ")) {
      const prompt = transcript.replace(/^(generate|make a file)\s+/i, "").trim();
      if (onGenerate) {
        onGenerate(prompt, generateFile);
        return;
      }
    }

    // Normal voice input -> Send immediately (Instant Mode)
    onSend(transcript);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-auto flex flex-col gap-2 px-4 pb-4 md:px-6 md:pb-6">
      <div className="glass mx-auto flex w-full max-w-[920px] items-end gap-4 rounded-[18px] border border-(--color-border) bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012)),var(--color-bg-surface)] px-4 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition-all duration-300 focus-within:-translate-y-px focus-within:border-(--color-accent) focus-within:shadow-(--shadow-accent)">
        <div className="flex h-10 items-center text-(--color-text-muted)">
          {isProcessingVoice ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Hash size={18} />
          )}
        </div>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={
            isProcessingVoice
              ? "Processing voice..."
              : "Type a message or ask about a file..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
            title={isAutoSpeakEnabled ? "Disable auto-speak" : "Enable auto-speak"}
            type="button"
          >
            {isAutoSpeakEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {disabled && onStop ? (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-red-500/15 text-red-500 transition-colors duration-200 hover:bg-red-500/30"
              onClick={onStop}
              title="Stop generation"
              type="button"
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
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[920px] flex-wrap justify-center gap-4 text-[10px] tracking-[0.05em] text-(--color-text-muted) uppercase md:gap-6">
        <span>
          <b className="text-(--color-text-secondary)">Shift + Enter</b> for new line
        </span>
        <span>
          <b className="text-(--color-text-secondary)">Enter</b> to send
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
