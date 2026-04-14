import React, { useState, useRef, useEffect } from "react";
import { Send, Hash, Loader2, Square } from "lucide-react";
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
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onVoiceResult,
  onGenerate,
  onStop,
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

  const handleVoiceRecording = async (blob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const response = await sendVoiceMessage(blob);
      // Voice endpoint already ran the agent — do NOT call onSend(transcript)
      // as that would trigger a second agent call with the same input.
      // Instead, pass the full result up so the parent can inject it directly
      // into message state.
      if (onVoiceResult) {
        onVoiceResult({
          transcript: response.transcript,
          agentResponse: response.agentResponse,
        });
      }
    } catch (err) {
      console.error("Voice processing failed:", err);
    } finally {
      setIsProcessingVoice(false);
    }
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
