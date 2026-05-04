"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTextToSpeechReturn {
  playing: boolean;
  paused: boolean;
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
 * - Supports pause/resume (pause() + play() resumes), and stop (reset to start).
 * - Emits word boundary charIndex events for highlight sync.
 */
export function useTextToSpeech(text: string): UseTextToSpeechReturn {
  const [playing, setPlaying]             = useState(false);
  const [paused, setPaused]               = useState(false);
  const [rate, setRateState]              = useState(1);
  const [currentCharIndex, setCharIndex]  = useState(-1);

  const uttRef           = useRef<SpeechSynthesisUtterance | null>(null);
  const rateRef          = useRef(1);
  const utteranceRateRef = useRef(1); // Track rate of current utterance
  const pausedRef        = useRef(false);

  // Keep rateRef in sync so play() closure sees latest rate
  // Only allow rate changes when not playing (to avoid restarting mid-playback)
  const setRate = useCallback((r: number) => {
    setRateState(r);
    rateRef.current = r;
    
    // If paused, rate will be applied on next resume/play
    // If playing, rate change is ignored (disable rate buttons while playing)
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
    setCharIndex(-1);
    pausedRef.current = false;
    utteranceRateRef.current = 1;
  }, []);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !text) return;

    // If paused, check if rate has changed
    if (pausedRef.current) {
      // If rate changed while paused, must restart from beginning
      if (utteranceRateRef.current !== rateRef.current) {
        window.speechSynthesis?.cancel();
        pausedRef.current = false;
        // Fall through to create new utterance
      } else {
        // Rate unchanged, just resume
        window.speechSynthesis?.resume();
        setPlaying(true);
        setPaused(false);
        return;
      }
    }

    // Start from beginning
    window.speechSynthesis.cancel();
    pausedRef.current = false;

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "ja-JP";
    utt.rate = rateRef.current;
    utteranceRateRef.current = rateRef.current;

    // Pick a Japanese voice if available
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) utt.voice = jaVoice;

    utt.onstart   = () => { setPlaying(true); setPaused(false); };
    utt.onend     = () => { setPlaying(false); setPaused(false); setCharIndex(-1); };
    utt.onerror   = () => { setPlaying(false); setPaused(false); setCharIndex(-1); };
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
    setPaused(true);
    pausedRef.current = true;
  }, []);

  // Cleanup on unmount or text change
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, [text]);

  return { playing, paused, rate, currentCharIndex, setRate, play, pause, stop };
}
