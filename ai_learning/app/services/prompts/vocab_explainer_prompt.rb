# frozen_string_literal: true

module Prompts
  class VocabExplainerPrompt
    LEVEL_GUIDANCE = {
      "n5" => "người mới bắt đầu, chỉ dùng từ vựng và kanji N5",
      "n4" => "trình độ sơ trung, có thể dùng từ N4 trở xuống",
      "n3" => "trình độ trung cấp, có thể dùng từ N3 trở xuống",
      "n2" => "trình độ trung cao, có thể dùng từ N2 trở xuống",
      "n1" => "trình độ cao cấp, không hạn chế từ vựng"
    }.freeze

    def self.build(word:, reading:, user_level:)
      level_note = LEVEL_GUIDANCE.fetch(user_level.to_s.downcase, LEVEL_GUIDANCE["n5"])

      <<~PROMPT
        Bạn là gia sư tiếng Nhật chuyên dạy cho người Việt. Hãy giải thích từ sau bằng tiếng Việt.

        Từ: #{word}（#{reading}）
        Trình độ người học: #{user_level.upcase} — #{level_note}

        Trả lời theo đúng cấu trúc sau (không thêm mục nào khác):

        ## Ý nghĩa
        Giải thích nghĩa chính và nghĩa phụ (nếu có) một cách ngắn gọn.

        ## Sắc thái & cách dùng
        Từ này dùng trong ngữ cảnh nào? Trang trọng hay thân mật? Khẩu ngữ hay văn viết?

        ## Lỗi hay gặp
        Người học Việt thường nhầm lẫn điểm gì khi dùng từ này?

        ## 3 câu ví dụ
        Mỗi ví dụ gồm:
        - Câu tiếng Nhật (dùng furigana cho kanji nếu trình độ N4 trở xuống)
        - Dịch tiếng Việt tự nhiên

        ## Từ dễ nhầm
        Liệt kê 1–2 từ có nghĩa gần hoặc cách viết tương tự, giải thích ngắn điểm khác biệt.

        Giữ toàn bộ phần giải thích ngắn gọn, phù hợp trình độ #{user_level.upcase}.
      PROMPT
    end
  end
end
