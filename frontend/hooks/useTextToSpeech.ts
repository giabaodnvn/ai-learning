"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTextToSpeechReturn {
  playing: boolean;
  rate: number;
  currentCharIndex: number;
  setRate: (r: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

/**
 * Wraps Web Speech API SpeechSynthesis for Japanese TTS.
 * - Sets ja-JP voice automatically.
 * - Emits word boundary charIndex events for highlight sync.
 */
export function useTextToSpeech(text: string): UseTextToSpeechReturn {
  const [playing, setPlaying]             = useState(false);
  const [rate, setRateState]              = useState(1);
  const [currentCharIndex, setCharIndex]  = useState(-1);

  const uttRef      = useRef<SpeechSynthesisUtterance | null>(null);
  const rateRef     = useRef(1);
  const pausedRef   = useRef(false);

  // Keep rateRef in sync so play() closure sees latest rate
  const setRate = useCallback((r: number) => {
    setRateState(r);
    rateRef.current = r;
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setCharIndex(-1);
    pausedRef.current = false;
  }, []);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !text) return;

    window.speechSynthesis.cancel();
    pausedRef.current = false;

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = rateRef.current;

    // Pick a Japanese voice if available
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utt.voice = jaVoice;

    utt.onstart   = () => setPlaying(true);
    utt.onend     = () => { setPlaying(false); setCharIndex(-1); };
    utt.onerror   = () => { setPlaying(false); setCharIndex(-1); };
    utt.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === "word") setCharIndex(e.charIndex);
    };

    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [text]);

  // If voices load asynchronously (Chrome), re-bind voice on next play
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.onvoiceschanged = () => {}; // trigger re-render on voice load
  }, []);

  const pause = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.pause();
    setPlaying(false);
    pausedRef.current = true;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  return { playing, rate, currentCharIndex, setRate, play, pause, stop };
}
