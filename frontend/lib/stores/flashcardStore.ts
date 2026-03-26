import { create } from "zustand";

export interface ReviewCard {
  id: number; // UserVocabularyProgress id
  vocabulary: {
    id: number;
    word: string;
    reading: string;
    meaning_vi: string;
    part_of_speech: string | null;
    jlpt_level: string;
  };
  due_date: string;
  repetitions: number;
  interval: number;
  ease_factor: number;
}

interface SessionStats {
  grades: number[]; // 0-3 per reviewed card, in order
}

interface FlashcardState {
  queue: ReviewCard[];
  currentIndex: number;
  revealed: boolean;
  sessionStats: SessionStats;

  initSession: (cards: ReviewCard[]) => void;
  flip: () => void;
  recordAndAdvance: (grade: number) => void;
  reset: () => void;
}

export const useFlashcardStore = create<FlashcardState>((set) => ({
  queue: [],
  currentIndex: 0,
  revealed: false,
  sessionStats: { grades: [] },

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
    }),
}));
