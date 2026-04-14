import React, { useState, useRef, useEffect } from "react";
import { Send, Hash, Loader2, Square, Volume2, VolumeX } from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";
import { sendVoiceMessage, generateFile } from "../../api/client";
import "./ChatInput.css";

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
    <div className="chat-input-wrapper">
      <div className="chat-input-container glass">
        <div className="chat-input-prefix">
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
        />
        <div className="chat-input-actions">
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecording}
            disabled={disabled || isProcessingVoice}
          />
          <button
            className={`auto-speak-toggle ${isAutoSpeakEnabled ? "active" : ""}`}
            onClick={onToggleAutoSpeak}
            title={isAutoSpeakEnabled ? "Disable auto-speak" : "Enable auto-speak"}
            style={{
              background: "transparent",
              border: "none",
              color: isAutoSpeakEnabled ? "var(--accent)" : "var(--color-text-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "all 0.2s"
            }}
          >
            {isAutoSpeakEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {disabled && onStop ? (
            <button
              className="stop-button"
              onClick={onStop}
              title="Stop generation"
            >
              <Square size={18} />
            </button>
          ) : (
            <button
              className={`send-button ${input.trim() && !disabled && !isProcessingVoice ? "active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim() || disabled || isProcessingVoice}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="chat-input-hint">
        <span>
          <b>Shift + Enter</b> for new line
        </span>
        <span>
          <b>Enter</b> to send
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
