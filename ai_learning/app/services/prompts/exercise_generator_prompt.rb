# frozen_string_literal: true

module Prompts
  class ExerciseGeneratorPrompt
    def self.build(pattern:, explanation_vi:, user_level:)
      level_label = GrammarCheckerPrompt::LEVEL_GUIDANCE.fetch(user_level.to_s.downcase, "N5 — sơ cấp")

      <<~PROMPT
        Bạn là giáo viên tiếng Nhật tạo bài tập cho học sinh Việt Nam.

        Ngữ pháp cần luyện: #{pattern}
        Giải thích: #{explanation_vi}
        Trình độ: #{level_label}

        Tạo một câu điền vào chỗ trống để luyện ngữ pháp trên.
        Trả về JSON theo schema sau, KHÔNG kèm markdown hay text ngoài JSON:

        {
          "sentence_with_blank": "câu tiếng Nhật với ___ đánh dấu chỗ điền",
          "options": ["lựa chọn A", "lựa chọn B", "lựa chọn C", "lựa chọn D"],
          "answer_index": 0,
          "explanation_vi": "giải thích tại sao đáp án đúng và tại sao các đáp án kia sai"
        }

        Yêu cầu:
        - Câu phải tự nhiên, phù hợp trình độ #{level_label}
        - answer_index là số nguyên 0-3 (chỉ số đáp án đúng trong mảng options)
        - 3 đáp án sai phải hợp lý, gần giống đáp án đúng để thách thức học sinh
        - Giải thích bằng tiếng Việt, ngắn gọn và rõ ràng
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
