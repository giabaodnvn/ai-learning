# frozen_string_literal: true

module Prompts
  class ListeningExercisePrompt
    LEVEL_SPECS = {
      "n5" => {
        length:     "50–80 chữ",
        script:     "Đơn độc nói (monologue) bằng tiếng Nhật đơn giản. Tốc độ nói chậm, rõ ràng.",
        kanji:      "Chỉ dùng kanji N5. Ghi rõ furigana cho TẤT CẢ kanji trong script.",
        grammar:    "Ngữ pháp N5: です/ます、は/が/を、động từ đơn giản.",
        dialogue:   "Một người nói (đơn độc)"
      },
      "n4" => {
        length:     "100–150 chữ",
        script:     "Hội thoại giữa 2 người (cửa hàng, ga tàu, v.v.). Tốc độ bình thường.",
        kanji:      "Kanji N4 trở xuống. Ghi furigana cho kanji N3+.",
        grammar:    "Ngữ pháp N4: て-form, たり〜たり, conditional forms.",
        dialogue:   "Hai người hội thoại"
      },
      "n3" => {
        length:     "150–200 chữ",
        script:     "Hội thoại 2–3 người, chủ đề phức tạp hơn. Tốc độ tự nhiên.",
        kanji:      "Kanji N3 trở xuống. Furigana chỉ cho kanji hiếm gặp.",
        grammar:    "Ngữ pháp N3: passive, causative, complex conjunctions.",
        dialogue:   "Hai hoặc ba người hội thoại"
      },
      "n2" => {
        length:     "200–280 chữ",
        script:     "Hội thoại tự nhiên hoặc ngắn tin tức. Tốc độ nhanh hơn.",
        kanji:      "Kanji N2 trở xuống. Furigana chỉ cho kanji ít gặp.",
        grammar:    "Ngữ pháp N2: keigo cơ bản, complex structures.",
        dialogue:   "Hoặc là hội thoại hoặc tin tức ngắn"
      },
      "n1" => {
        length:     "250–350 chữ",
        script:     "Hội thoại tự nhiên nhanh, có thể chứa slang/keigo nâng cao. Tốc độ nhanh, tự nhiên.",
        kanji:      "Không hạn chế kanji. Furigana chỉ khi thực sự cần thiết.",
        grammar:    "Ngữ pháp N1: literary forms, advanced keigo.",
        dialogue:   "Hội thoại tự nhiên với 2–3 người"
      }
    }.freeze

    def self.build(topic:, jlpt_level:)
      spec = LEVEL_SPECS.fetch(jlpt_level.to_s.downcase, LEVEL_SPECS["n5"])

      <<~PROMPT
        Bạn là chuyên gia tạo bài luyện nghe hiểu tiếng Nhật cho người học Việt.

        Tạo một bài luyện nghe với các thông số sau:
        - Chủ đề: #{topic}
        - Trình độ: JLPT #{jlpt_level.upcase}
        - Độ dài: #{spec[:length]}
        - Script: #{spec[:script]}
        - Kanji: #{spec[:kanji]}
        - Ngữ pháp: #{spec[:grammar]}
        - Hình thức: #{spec[:dialogue]}

        Trả về JSON theo đúng schema sau, KHÔNG kèm markdown hay text ngoài JSON:

        {
          "title": "Tiêu đề bằng tiếng Nhật (String đơn thuần, không ruby tags)",
          "script_ja": "Full text bằng tiếng Nhật. ĐÂY LÀ SCRIPT NGHE - phải đọc được tự nhiên bằng TTS. Không có ruby tags, không có kí hiệu đặc biệt.",
          "script_vi": "Bản dịch đầy đủ toàn bộ script sang tiếng Việt cho người học hiểu rõ.",
          "questions": [
            {
              "question_ja": "Câu hỏi bằng tiếng Nhật",
              "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
              "correct_index": 0
            }
          ]
        }

        Yêu cầu:
        - "title": String đơn thuần (VD: "カフェでの会話")
        - "script_ja": Đây là nội dung sẽ được đọc bằng TTS. KHÔNG CÓ ruby tags, KHÔNG CÓ các kí hiệu HTML/markdown. Chỉ là text thường đơn giản. Nếu cần chỉ dẫn tốc độ nói, viết trong ngoặc (), như: (천천히) "こんにちは"
        - "script_vi": Bản dịch tiếng Việt, cũng là text thường
        - "questions": Đúng 4 câu hỏi trắc nghiệm, mỗi câu có 4 lựa chọn, tất cả bằng text thường KHÔNG ruby tags
        - "correct_index": Index 0–3 của đáp án đúng, phải NGẪU NHIÊN (không lúc nào đều ở vị trí 0)
        - Câu hỏi phải kiểm tra sự HIỂU NỘI DUNG thực sự từ việc nghe, không chỉ tìm từ nghe được
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
