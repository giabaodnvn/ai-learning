# frozen_string_literal: true

module Prompts
  class WritingFeedbackPrompt
    LEVEL_GUIDANCE = {
      "n5" => "N5 — sơ cấp (hiragana, katakana, ~100 kanji, cấu trúc câu đơn giản)",
      "n4" => "N4 — sơ trung (~300 kanji, thì quá khứ, điều kiện cơ bản)",
      "n3" => "N3 — trung cấp (~650 kanji, biểu đạt phức tạp, văn phong trung bình)",
      "n2" => "N2 — trung cao (~1000 kanji, ngữ pháp phức tạp, văn viết)",
      "n1" => "N1 — cao cấp (~2000 kanji, biểu đạt tự nhiên, văn học)"
    }.freeze

    def self.build(text:, user_level:, topic: nil)
      level_label = LEVEL_GUIDANCE.fetch(user_level.to_s.downcase, LEVEL_GUIDANCE["n5"])
      topic_line  = topic.present? ? "Chủ đề: #{topic}" : "Không có chủ đề cụ thể"

      <<~PROMPT
        Bạn là giáo viên tiếng Nhật chuyên chữa bài viết cho người học Việt.

        Trình độ người học: #{level_label}
        #{topic_line}

        Bài viết của học viên:
        ===
        #{text}
        ===

        Hãy viết phản hồi chi tiết bằng tiếng Việt theo đúng cấu trúc Markdown sau.
        Không thêm lời mở đầu — bắt đầu thẳng vào phần đầu tiên.

        ## Nhận xét chung
        Nhận xét 2–3 câu về bài viết: độ phức tạp, ý tưởng, mức độ phù hợp với trình độ #{user_level.upcase}.

        ## Lỗi ngữ pháp
        Liệt kê từng lỗi (nếu có) theo dạng:
        - **「phần sai」** → `phần đúng` — giải thích ngắn gọn bằng tiếng Việt

        Nếu không có lỗi, viết: _Không phát hiện lỗi ngữ pháp._

        ## Từ vựng & Diễn đạt
        Gợi ý 2–3 cách dùng từ / cụm từ tự nhiên hơn (nếu có).
        Dạng: **「từ đã dùng」** → `từ tự nhiên hơn` — lý do

        Nếu từ vựng đã tốt, viết: _Lựa chọn từ ngữ phù hợp._

        ## Câu đã sửa
        Viết lại toàn bộ đoạn văn sau khi sửa tất cả lỗi. Không thêm chú thích, chỉ viết câu tiếng Nhật thuần.

        ## 3 Gợi ý cải thiện
        Ba hành động cụ thể học viên nên làm để tiến bộ, phù hợp trình độ #{user_level.upcase}:
        1. ...
        2. ...
        3. ...
      PROMPT
    end
  end
end
