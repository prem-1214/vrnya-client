import React, { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import "./VoiceRecorder.css";

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string) => void;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in this browser.");
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
      className={`voice-recorder-button ${isRecording ? "recording" : ""}`}
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
      {isRecording && <span className="recording-pulse"></span>}
    </button>
  );
};

export default VoiceRecorder;
