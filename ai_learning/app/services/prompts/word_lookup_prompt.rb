# frozen_string_literal: true

module Prompts
  class WordLookupPrompt
    def self.build(word:)
      <<~PROMPT
        Tra cứu từ tiếng Nhật sau và trả về JSON.
        Từ cần tra: #{word}

        Trả về JSON theo đúng schema sau, KHÔNG kèm markdown hay text ngoài JSON:
        {
          "word": "từ gốc",
          "reading": "cách đọc hiragana/katakana",
          "meaning_vi": "nghĩa tiếng Việt ngắn gọn (1–2 nghĩa chính)",
          "example": "một câu ví dụ ngắn bằng tiếng Nhật sử dụng từ này",
          "example_vi": "dịch nghĩa câu ví dụ sang tiếng Việt"
        }

        Yêu cầu:
        - Nếu từ là động từ, ghi dạng từ điển (dictionary form)
        - meaning_vi phải ngắn gọn, súc tích
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
