import { useCallback, useRef, useEffect } from "react";

export function useTextToSpeech() {
  const lastSpokenRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);
  const warmedUpRef = useRef(false);

  // Warm up speech synthesis on first user interaction so subsequent calls work
  useEffect(() => {
    const warmUp = () => {
      if (warmedUpRef.current) return;
      warmedUpRef.current = true;
      const utterance = new SpeechSynthesisUtterance("");
      utterance.volume = 0;
      window.speechSynthesis?.speak(utterance);
    };

    document.addEventListener("click", warmUp, { once: true });
    document.addEventListener("keydown", warmUp, { once: true });
    return () => {
      document.removeEventListener("click", warmUp);
      document.removeEventListener("keydown", warmUp);
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    const now = Date.now();
    // Don't repeat same gesture within 2.5 seconds
    if (text === lastSpokenRef.current && now - lastTimeRef.current < 2500) return;

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    // Small delay to ensure cancel completes before new speech
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to pick a good voice
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en") && v.localService
        );
        if (englishVoice) utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    }, 50);

    lastSpokenRef.current = text;
    lastTimeRef.current = now;
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stopSpeaking };
}
