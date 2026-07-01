export interface AnswerResult {
  correct: boolean;
  correct_index: number;
  explanation_vi: string;
}

export const JLPT_LEVELS = ["n5", "n4", "n3", "n2", "n1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];
