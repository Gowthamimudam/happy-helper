import { useCallback, useRef } from "react";

export function useTextToSpeech() {
  const lastSpokenRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    const now = Date.now();
    // Don't repeat same gesture within 3 seconds
    if (text === lastSpokenRef.current && now - lastTimeRef.current < 3000) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);

    lastSpokenRef.current = text;
    lastTimeRef.current = now;
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
  }, []);

  return { speak, stopSpeaking };
}
