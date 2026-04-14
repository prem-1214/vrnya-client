import { useState, useCallback, useEffect, useRef } from "react";

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = window.speechSynthesis;
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    synth.cancel();
    setIsSpeaking(false);
    currentUtterance.current = null;
  }, [synth]);

  const speak = useCallback((text: string) => {
    if (!text) return;

    // Stop any current speech before starting new one
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance.current = utterance;

    // Optional: Pick a good voice if available
    const voices = synth.getVoices();
    const preferredVoice = voices.find(
      (v) => 
        (v.name.includes("Google") && v.lang.startsWith("en")) || 
        (v.name.includes("Samantha") && v.lang === "en-US") ||
        (v.name.includes("Premium") && v.lang.startsWith("en"))
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [synth, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synth.cancel();
    };
  }, [synth]);

  return { speak, stop, isSpeaking };
};
