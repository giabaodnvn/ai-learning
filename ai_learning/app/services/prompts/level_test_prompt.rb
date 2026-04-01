# frozen_string_literal: true

module Prompts
  module LevelTestPrompt
    LEVEL_DESCRIPTIONS = {
      "n5" => "N5 (sơ cấp: ~800 từ, 100 kanji, ngữ pháp cơ bản như は/が/を, て形, ます形)",
      "n4" => "N4 (sơ trung cấp: ~1500 từ, 300 kanji, ngữ pháp như たら/ば/ように/させる)",
      "n3" => "N3 (trung cấp: ~3750 từ, 650 kanji, ngữ pháp phức tạp hơn)",
      "n2" => "N2 (trung cao cấp: ~6000 từ, 1000 kanji, biểu đạt sắc thái)",
      "n1" => "N1 (cao cấp: ~10000 từ, 2000 kanji, diễn đạt học thuật/văn học)"
    }.freeze

    def self.build(level:)
      desc = LEVEL_DESCRIPTIONS[level] || level.upcase

      <<~PROMPT
        Bạn là chuyên gia tạo đề thi JLPT. Hãy tạo một bài kiểm tra JLPT mini cho trình độ #{level.upcase} (#{desc}).

        Bài thi gồm 3 phần:
        - Phần 1 "文字・語彙" (Từ vựng & Chữ viết): 10 câu hỏi trắc nghiệm 4 lựa chọn
        - Phần 2 "文法" (Ngữ pháp): 10 câu hỏi trắc nghiệm 4 lựa chọn
        - Phần 3 "読解" (Đọc hiểu): 1 đoạn văn ngắn (100-150 chữ) + 5 câu hỏi trắc nghiệm 4 lựa chọn

        Yêu cầu:
        - Độ khó đúng trình độ #{level.upcase}, không quá dễ hoặc quá khó
        - Câu hỏi đa dạng, không lặp lại từ vựng/ngữ pháp
        - Các lựa chọn sai phải hợp lý (đừng để quá dễ đoán)
        - Giải thích bằng tiếng Việt
        - Đánh số question id liên tiếp từ 1

        Trả về JSON THUẦN TÚY (không có markdown, không có giải thích):
        {
          "title": "JLPT #{level.upcase} Mini Test",
          "sections": [
            {
              "name": "文字・語彙",
              "name_vi": "Từ vựng & Chữ viết",
              "questions": [
                {
                  "id": 1,
                  "question": "（　）に何を入れますか。 or 「___」の読み方は？",
                  "options": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
                  "answer_index": 0,
                  "explanation_vi": "Giải thích bằng tiếng Việt"
                }
              ]
            },
            {
              "name": "文法",
              "name_vi": "Ngữ pháp",
              "questions": [
                {
                  "id": 11,
                  "question": "（　）に正しい文法を選んでください。",
                  "options": ["..."],
                  "answer_index": 0,
                  "explanation_vi": "..."
                }
              ]
            },
            {
              "name": "読解",
              "name_vi": "Đọc hiểu",
              "passage": "Đoạn văn tiếng Nhật 100-150 chữ ở đây",
              "questions": [
                {
                  "id": 21,
                  "question": "問い文",
                  "options": ["..."],
                  "answer_index": 0,
                  "explanation_vi": "..."
                }
              ]
            }
          ]
        }
      PROMPT
    end
  end
end
