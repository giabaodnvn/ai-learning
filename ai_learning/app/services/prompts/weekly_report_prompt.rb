# frozen_string_literal: true

module Prompts
  class WeeklyReportPrompt
    def self.build(data:)
      missed_words = data[:missed_words].presence&.join(", ") || "không có dữ liệu"

      <<~PROMPT
        Bạn là gia sư tiếng Nhật nhiệt tình và am hiểu phương pháp học ngôn ngữ.

        Dưới đây là dữ liệu học tiếng Nhật của học viên trong 7 ngày qua:
        - Tổng thẻ đã ôn tập: #{data[:total_reviewed]}
        - Tỷ lệ trả lời đúng: #{data[:accuracy]}%
        - Số buổi hội thoại AI: #{data[:conversation_count]}
        - Chuỗi ngày học liên tiếp hiện tại: #{data[:streak_count]} ngày
        - Trình độ JLPT hiện tại: #{data[:jlpt_level]&.upcase}
        - 5 từ/thẻ gặp khó khăn nhất (ease_factor thấp nhất): #{missed_words}

        Hãy viết một **báo cáo tiến độ học tiếng Nhật hàng tuần** bằng tiếng Việt.

        Yêu cầu:
        - Phong cách: khích lệ, cụ thể, không chung chung
        - Nhận xét thực tế dựa trên số liệu (đừng bịa đặt)
        - Chỉ rõ điểm yếu cần cải thiện
        - Đề xuất đúng 3 hành động cụ thể cho tuần tới
        - Độ dài: 200–300 từ
        - Dùng markdown nhẹ: **in đậm** cho điểm quan trọng, danh sách cho đề xuất
        - KHÔNG có lời mở đầu kiểu "Báo cáo của bạn..." hay "Chào bạn..."
          — đi thẳng vào nội dung
      PROMPT
    end
  end
end
