import { create } from "zustand";
import type { FlashCard, SessionMode } from "@/lib/flashcard-utils";

export type { FlashCard };

interface SessionStats {
  grades: number[]; // 0-3 per reviewed card, in order
}

export interface SessionConfig {
  mode: SessionMode;
  level?: string;
}

interface FlashcardState {
  queue: FlashCard[];
  currentIndex: number;
  revealed: boolean;
  sessionStats: SessionStats;
  sessionConfig: SessionConfig | null;

  setSessionConfig: (config: SessionConfig) => void;
  initSession: (cards: FlashCard[]) => void;
  flip: () => void;
  recordAndAdvance: (grade: number) => void;
  reset: () => void;
}

export const useFlashcardStore = create<FlashcardState>((set) => ({
  queue: [],
  currentIndex: 0,
  revealed: false,
  sessionStats: { grades: [] },
  sessionConfig: null,

  setSessionConfig: (config) => set({ sessionConfig: config }),

  initSession: (cards) =>
    set({
      queue: cards,
      currentIndex: 0,
      revealed: false,
      sessionStats: { grades: [] },
    }),

  flip: () => set({ revealed: true }),

  recordAndAdvance: (grade) =>
    set((state) => ({
      sessionStats: { grades: [...state.sessionStats.grades, grade] },
      currentIndex: state.currentIndex + 1,
      revealed: false,
    })),

  reset: () =>
    set({
      queue: [],
      currentIndex: 0,
      revealed: false,
      sessionStats: { grades: [] },
      sessionConfig: null,
    }),
}));
