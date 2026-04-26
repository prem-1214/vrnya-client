import React, { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { useModal } from "../../context/ModalContext"; // ✅ NEW: Custom modal

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const { showError } = useModal(); // ✅ NEW: Use modal
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecordingRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      isRecordingRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showError(
        "Not Supported",
        "Browser speech recognition is not supported in this browser.",
      ); // ✅ UPDATED
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let fullTranscript = "";

      recognition.onresult = (event: any) => {
        fullTranscript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, 2000);
      };

      recognition.onspeechend = () => {
        setTimeout(() => stopRecording(), 300);
      };

      recognition.onend = () => {
        if (fullTranscript.trim()) {
          onRecordingComplete(fullTranscript.trim());
        }
        setIsRecording(false);
        isRecordingRef.current = false;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [onRecordingComplete, stopRecording]);

  return (
    <button
      className={`relative flex h-10 w-10 items-center justify-center overflow-visible rounded-full border-0 p-0 transition-all duration-200 ${
        isRecording
          ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
          : "bg-white/5 text-slate-400 hover:scale-105 hover:bg-white/10 hover:text-slate-50"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      title={isRecording ? "Stop Recording" : "Record Voice Command"}
      type="button"
    >
      {isRecording ? (
        <Square size={18} fill="currentColor" />
      ) : (
        <Mic size={18} />
      )}
      {isRecording && (
        <span className="absolute -inset-0.5 animate-ping rounded-full border-2 border-red-500 opacity-60" />
      )}
    </button>
  );
};

export default VoiceRecorder;
