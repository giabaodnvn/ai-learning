# frozen_string_literal: true

module Prompts
  class ReadingGeneratorPrompt
    LEVEL_SPECS = {
      "n5" => {
        length:  "80–120 chữ",
        kanji:   "Chỉ dùng kanji N5. Thêm furigana cho TẤT CẢ kanji.",
        grammar: "Ngữ pháp N5: です/ます、は/が/を、simple verb forms only."
      },
      "n4" => {
        length:  "120–180 chữ",
        kanji:   "Kanji N4 trở xuống. Thêm furigana cho N3+ kanji.",
        grammar: "Ngữ pháp N4: て-form, たり〜たり、〜ている、conditional forms."
      },
      "n3" => {
        length:  "200–280 chữ",
        kanji:   "Kanji N3 trở xuống. Furigana chỉ cho N2+ kanji.",
        grammar: "Ngữ pháp N3: passive, causative, complex conjunctions."
      },
      "n2" => {
        length:  "300–400 chữ",
        kanji:   "Kanji N2 trở xuống. Furigana cho kanji ít gặp.",
        grammar: "Ngữ pháp N2: keigo cơ bản, complex sentence structures."
      },
      "n1" => {
        length:  "400–500 chữ",
        kanji:   "Không hạn chế kanji. Furigana chỉ khi thực sự cần thiết.",
        grammar: "Ngữ pháp N1: literary forms, advanced keigo, classical expressions."
      }
    }.freeze

    def self.build(topic:, jlpt_level:)
      spec = LEVEL_SPECS.fetch(jlpt_level.to_s.downcase, LEVEL_SPECS["n5"])

      <<~PROMPT
        Bạn là chuyên gia tạo tài liệu đọc hiểu tiếng Nhật cho người học Việt.

        Tạo một bài đọc tiếng Nhật với các thông số sau:
        - Chủ đề: #{topic}
        - Trình độ: JLPT #{jlpt_level.upcase}
        - Độ dài: #{spec[:length]}
        - Kanji: #{spec[:kanji]}
        - Ngữ pháp: #{spec[:grammar]}

        Trả về JSON theo đúng schema sau, KHÔNG kèm markdown hay text ngoài JSON:

        {
          "title": "tiêu đề bài đọc bằng tiếng Nhật",
          "content": "nội dung bài đọc có furigana. Sử dụng HTML <ruby> tags với <rt> để đánh dấu furigana cho từng kanji hoặc cụm kanji.",
          "vocabulary_highlights": [
            {
              "word": "単語",
              "reading": "たんご",
              "meaning_vi": "từ vựng"
            }
          ],
          "questions": [
            {
              "question": "câu hỏi bằng tiếng Nhật",
              "options": [
                "lựa chọn A",
                "lựa chọn B",
                "lựa chọn C",
                "lựa chọn D"
              ],
              "answer_index": 0
            }
          ]
        }

        Yêu cầu:
        - "content" phải chứa furigana bằng HTML ruby tags, ví dụ: <ruby>漢字<rt>かんじ</rt></ruby>
        - Không dùng <p> tag cho paragraphs. Sử dụng <br/> hoặc \n để phân tách đoạn văn thay vào đó
        - Không dùng định dạng furigana như 《...》 hoặc chú giải chữ ngoài HTML ruby
        - "vocabulary_highlights": 5–8 từ quan trọng xuất hiện trong bài, chọn từ hữu ích cho trình độ #{jlpt_level.upcase}
        - "questions": đúng 4 câu hỏi trắc nghiệm, mỗi câu có đúng 4 lựa chọn
        - "answer_index": index 0–3 của đáp án đúng
        - Câu hỏi phải kiểm tra hiểu nội dung thực sự, không chỉ tìm từ trong bài
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
      PROMPT
    end
  end
end
