# frozen_string_literal: true

module Prompts
  class GrammarSetPrompt
    def self.build(pattern:, explanation_vi:, user_level:)
      level_label = GrammarCheckerPrompt::LEVEL_GUIDANCE.fetch(user_level.to_s.downcase, "N5 — sơ cấp")

      <<~PROMPT
        Bạn là giáo viên tiếng Nhật tạo bộ 10 bài tập luyện ngữ pháp cho học sinh Việt Nam.

        Ngữ pháp cần luyện: #{pattern}
        Giải thích: #{explanation_vi}
        Trình độ: #{level_label}

        Tạo một bộ 10 bài tập gồm:
        - 5 bài điền chỗ trống (fill_blank)
        - 3 bài chọn câu đúng (choice)
        - 2 bài dịch từ Việt sang Nhật (translate)

        Trả về JSON array của 10 bài tập, KHÔNG kèm markdown hay text ngoài JSON:

        [
          {
            "type": "fill_blank",
            "sentence_with_blank": "câu tiếng Nhật với ___ đánh dấu chỗ điền",
            "options": ["lựa chọn A", "lựa chọn B", "lựa chọn C", "lựa chọn D"],
            "answer_index": 2,
            "explanation_vi": "giải thích tại sao đáp án đúng"
          },
          {
            "type": "choice",
            "question_vi": "Câu nào sử dụng ngữ pháp '#{pattern}' đúng?",
            "options": ["câu tiếng Nhật A", "câu tiếng Nhật B", "câu tiếng Nhật C", "câu tiếng Nhật D"],
            "answer_index": 0,
            "explanation_vi": "giải thích"
          },
          {
            "type": "translate",
            "prompt_vi": "Cụm từ hoặc câu tiếng Việt để dịch",
            "correct_answer": "Dịch sang tiếng Nhật sử dụng ngữ pháp #{pattern}",
            "explanation_vi": "giải thích tại sao dịch như vậy"
          }
        ]

        Yêu cầu:
        - Các câu phải tự nhiên, phù hợp trình độ #{level_label}
        - Bài điền chỗ trống: answer_index là số nguyên 0-3, 3 đáp án sai phải hợp lý
        - Bài chọn câu đúng: question_vi giải thích rõ ràng, tất cả 4 câu phải hợp lệ tiếng Nhật
        - Bài dịch: correct_answer là bản dịch chính xác sử dụng ngữ pháp #{pattern}
        - Giải thích bằng tiếng Việt, ngắn gọn và rõ ràng
        - answer_index PHẢI NGẪU NHIÊN (không lúc nào đều ở vị trí 0 hoặc 1)
        - Chỉ trả về JSON array của 10 exercises, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
