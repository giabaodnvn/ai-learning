# frozen_string_literal: true

# LevelTest — an AI-generated mini JLPT exam stored permanently in the DB.
# Structure of +sections+ (JSON):
#   [
#     {
#       name:      "文字・語彙",
#       name_vi:   "Từ vựng & Chữ viết",
#       questions: [
#         { id: 1, question: "...", options: ["A","B","C","D"],
#           answer_index: 0, explanation_vi: "..." }
#       ]
#     },
#     { name: "文法", name_vi: "Ngữ pháp", questions: [...] },
#     { name: "読解", name_vi: "Đọc hiểu", passage: "...", questions: [...] }
#   ]
class LevelTest < ApplicationRecord
  JLPT_LEVELS   = %w[n5 n4 n3 n2 n1].freeze
  LEVEL_UP_MAP  = { "n5" => "n4", "n4" => "n3", "n3" => "n2", "n2" => "n1" }.freeze
  PASS_PERCENT  = 70  # minimum correct % to pass

  after_initialize { self.sections ||= [] }

  has_many :level_test_attempts, dependent: :destroy

  validates :jlpt_level,      presence: true, inclusion: { in: JLPT_LEVELS }
  validates :title,           presence: true
  validates :total_questions, numericality: { greater_than: 0 }
  validates :pass_score,      numericality: { greater_than: 0 }

  scope :for_level, ->(lvl) { where(jlpt_level: lvl).order(created_at: :desc) }

  # Flatten all questions across sections with their section_index.
  def all_questions
    sections.each_with_index.flat_map do |sec, si|
      (sec["questions"] || []).map { |q| q.merge("section_index" => si) }
    end
  end

  # Grade a submission.
  # answers: [{ "question_id" => int, "section_index" => int, "answer_index" => int }, ...]
  # Returns { score:, total:, passed:, per_section: }
  def grade(answers)
    answer_map = answers.each_with_object({}) do |a, h|
      h[[a["section_index"].to_i, a["question_id"].to_i]] = a["answer_index"].to_i
    end

    correct      = 0
    per_section  = sections.each_with_index.map do |sec, si|
      sec_correct = 0
      (sec["questions"] || []).each do |q|
        qid = q["id"].to_i
        if answer_map[[si, qid]] == q["answer_index"].to_i
          correct     += 1
          sec_correct += 1
        end
      end
      { name: sec["name_vi"], correct: sec_correct, total: (sec["questions"] || []).size }
    end

    { score: correct, total: total_questions, passed: correct >= pass_score,
      per_section: per_section }
  end
end
