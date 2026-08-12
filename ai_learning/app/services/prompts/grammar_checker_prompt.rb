# frozen_string_literal: true

module Prompts
  class GrammarCheckerPrompt
    def self.build(sentence:, target_grammar:, user_level:)
      level_label = LevelLabels.short(user_level)

      <<~PROMPT
        Bạn là giáo viên tiếng Nhật kiểm tra ngữ pháp cho người học Việt.

        Câu cần kiểm tra: 「#{sentence}」
        Ngữ pháp trọng tâm: #{target_grammar}
        Trình độ người học: #{level_label}

        Hãy phân tích câu trên và trả về JSON theo đúng schema sau, KHÔNG kèm markdown hay text ngoài JSON:

        {
          "correct": true | false,
          "errors": [
            {
              "part": "phần câu bị sai (trích nguyên văn)",
              "issue_vi": "giải thích lỗi bằng tiếng Việt",
              "suggestion": "cách sửa đúng"
            }
          ],
          "rewritten_sentence": "câu đã sửa hoàn chỉnh (giữ nguyên nếu đúng)",
          "explanation_vi": "giải thích tổng thể bằng tiếng Việt: tại sao đúng/sai, cách dùng #{target_grammar} chính xác là gì"
        }

        Lưu ý:
        - Nếu câu đúng, "errors" là mảng rỗng []
        - "part" phải là chuỗi xuất hiện trong câu gốc
        - Giải thích phù hợp trình độ #{level_label}
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
