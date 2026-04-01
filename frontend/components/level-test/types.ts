export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  answer_index?: number;       // only present in result view
  explanation_vi?: string;     // only present in result view
  your_answer_index?: number;  // only present in result view
}

export interface TestSection {
  name: string;
  name_vi: string;
  passage?: string;
  questions: TestQuestion[];
}

export interface LevelTestInfo {
  id: number;
  jlpt_level: string;
  title: string;
  total_questions: number;
  pass_score: number;
  time_limit_min: number;
  sections: TestSection[];
}

export interface TestSummary {
  id: number;
  jlpt_level: string;
  title: string;
  total_questions: number;
  pass_score: number;
  time_limit_min: number;
  created_at: string;
}

export interface AttemptSummary {
  id: number;
  score: number;
  total: number;
  passed: boolean;
  accuracy: number;
  level_after: string | null;
  taken_at: string;
}

export interface SubmitResult {
  attempt_id: number;
  score: number;
  total: number;
  passed: boolean;
  pass_score: number;
  per_section: { name: string; correct: number; total: number }[];
  level_up: { from: string; to: string } | null;
  sections: TestSection[];
}

export type Answer = { question_id: number; section_index: number; answer_index: number };
