# Lộ trình tính năng — Ứng dụng học tiếng Nhật

**Cập nhật lần cuối**: 5 tháng 5, 2026  
**Chân trời kế hoạch**: 12 tháng

---

## 🎯 Mục tiêu chiến lược

1. **Bao phủ tất cả các lĩnh vực kỹ năng JLPT** (nghe + viết + đọc + ngữ pháp)
2. **Tăng số lượng người dùng hoạt động hàng ngày** (sự tham gia + giữ chân)
3. **Cho phép kiếm tiền** (tính năng VIP, khóa học trả phí)
4. **Phân biệt với các đối thủ cạnh tranh** (Duolingo, Anki, gia sư con người)

---

## 📅 Lộ trình theo quý

### Q2 2026 (Tháng 5–7) — Nền tảng Nghe & Viết

#### Sprint 2.1: Luyện nghe (Tuần 1–4)
**Mục tiêu**: Thêm bài luyện nghe hiểu JLPT

**Tính năng**:
- [ ] Trình tạo bài luyện nghe (Claude tạo kịch bản hội thoại)
- [ ] Tổng hợp âm thanh (TTS hoặc tích hợp API âm thanh bên ngoài)
- [ ] UI: Trình phát âm thanh + câu hỏi trắc nghiệm
- [ ] Các tier độ khó: Chậm (N5/N4) → Bình thường (N3/N2) → Nhanh (N1)
- [ ] Tạo bài học độ khó tự động dựa trên cấp độ người dùng
- [ ] Bảng điều khiển thống kê nghe (% đúng theo tốc độ)

**Công việc Backend**:
```ruby
# Model mới: ListeningExercise
- id, topic, script_ja, script_vi, audio_url, level, created_by
- questions: [{question_ja, options[], correct_index}]

# Controller mới: listening_exercises_controller.rb
- POST /api/v1/listening/generate  — Tạo bài luyện mới
- GET  /api/v1/listening/:id        — Lấy chi tiết bài luyện
- POST /api/v1/listening/:id/submit — Kiểm tra câu trả lời
```

**Công việc Frontend**:
```tsx
# Trang mới:
- /app/listening           — Duyệt bài luyện
- /app/listening/[id]      — Trình phát bài luyện

# Component mới:
- ListeningPlayer          — Âm thanh + UI
- ListeningResults         — Điểm & phản hồi
```

**Nỗ lực**: 3–4 tuần | **Ưu tiên**: 🔴 Cực cao | **Chướng ngại vật**: Không

---

#### Sprint 2.2: Bài tập ngữ pháp (Tuần 3–6)
**Mục tiêu**: Luyện tập ngữ pháp interactive

**Tính năng**:
- [ ] Bài tập fill-in-the-blank (người dùng gõ hạt/chia động từ)
- [ ] Bài tập trắc nghiệm ngữ pháp
- [ ] Xây dựng câu (kéo hạt để xây dựng câu)
- [ ] Luyện dịch (Việt → Nhật)
- [ ] Bộ luyện ngữ pháp (10–20 bài tập mỗi mẫu)
- [ ] Theo dõi streak cho mỗi mẫu ngữ pháp
- [ ] Tích hợp với SRS (các mẫu học được xem xét)

**Công việc Backend**:
```ruby
# Model mới: GrammarExercise
- id, grammar_point_id, exercise_type (fill_blank, choice, construct, translate)
- prompt, correct_answer, explanations

# Controller mới: grammar_exercises_controller.rb
- POST /api/v1/grammar_points/:id/generate_exercise  — Đã tồn tại!
- POST /api/v1/grammar_exercises/:id/submit
```

**Công việc Frontend**:
```tsx
# Mở rộng tồn tại:
- /app/grammar/[id]  — Thêm tab bài tập
- GrammarExerciseForm — Component mới cho tương tác
- ExerciseResult       — Phản hồi & giải thích
```

**Nỗ lực**: 2–3 tuần | **Ưu tiên**: 🔴 Cao | **Chướng ngại vật**: Hoàn thành dữ liệu ngữ pháp

---

#### Sprint 2.3: Luyện viết Kanji (Tuần 4–7)
**Mục tiêu**: Luyện viết tay cho kanji

**Tính năng**:
- [ ] Vẽ nét dựa trên canvas
- [ ] Hình ảnh động thứ tự nét (hiển thị trình tự đúng)
- [ ] Phát hiện nét (xác thực bài viết của người dùng khớp với hình thức đúng)
- [ ] Phân tách radical (hiển thị radical + nghĩa)
- [ ] Bài tập viết kanji (kanji ngẫu nhiên, 5–10 mỗi phiên)
- [ ] Độ khó: Hiển thị thứ tự nét vs. không có gợi ý
- [ ] Theo dõi tiến độ

**Công việc Backend**:
```ruby
# Không cần model mới—mở rộng mô hình Kanji
- Kanji: thêm stroke_order (JSON array của tọa độ nét)

# Controller mới: kanji_handwriting_controller.rb
- POST /api/v1/kanjis/:id/validate_stroke  — Kiểm tra vẽ
```

**Công việc Frontend**:
```tsx
# Thư viện mới: react-drawing-canvas (hoặc canvas tùy chỉnh)
# Trang mới:
- /app/kanji/handwriting  — Chế độ bài tập viết
# Component mới:
- StrokeCanvas           — Vùng vẽ
- StrokeOrderAnimation   — Hiển thị trình tự đúng
```

**Nỗ lực**: 3 tuần | **Ưu tiên**: 🟡 Trung bình | **Chướng ngại vật**: Dữ liệu nét trong DB kanji

**Lưu ý**: Cần thêm dữ liệu `stroke_order` vào tất cả kanji (kịch bản tự động hóa)

---

### Q3 2026 (Tháng 8–10) — Di động & Cộng đồng

#### Sprint 3.1: Ứng dụng di động (Flutter) (Tuần 1–6)
**Mục tiêu**: Học tập gốc iOS/Android

**Tính năng**:
- [ ] Phản chiếu các tính năng cốt lõi (từ vựng, ngữ pháp, flashcard, đọc)
- [ ] Chế độ offline cho flashcard (cache thẻ cục bộ)
- [ ] Thông báo đẩy (nhắc hàng ngày, xem xét đến hạn)
- [ ] Điều hướng dựa trên cử chỉ (vuốt giữa các thẻ)
- [ ] Hỗ trợ bàn phím tốt hơn (IME tiếng Nhật)
- [ ] Danh sách cửa hàng ứng dụng (Play Store, App Store)

**Tech Stack**: Flutter + Dart (code-share friendly)

**Nỗ lực**: 4–6 tuần | **Ưu tiên**: 🟡 Cao | **Chướng ngại vật**: Tính ổn định API

---

#### Sprint 3.2: Tính năng cộng đồng (Tuần 4–8)
**Mục tiêu**: Học tập ngang hàng & sự tham gia

**Tính năng**:
- [ ] Ghép đôi trao đổi ngôn ngữ (kết nối những người học ở cấp độ tương tự)
- [ ] Chat/gọi thoại đơn giản (được hỗ trợ bởi WebRTC hoặc Twilio)
- [ ] Luồng bình luận về những khái niệm khó
- [ ] Nội dung do người dùng tạo (mẹo, thủ thuật ghi nhớ)
- [ ] Bảng xếp hạng (tùy chọn; tôn trọng quyền riêng tư)
- [ ] Nhóm học (ví dụ: "Nhóm N2 tháng 3")

**Công việc Backend**:
```ruby
# Model mới:
- UserProfile (mở rộng với avatar, bio, goal_level)
- LanguageExchange (ghép đôi người dùng, theo dõi tương tác)
- PostComment (bình luận theo luồng về ngữ pháp/từ vựng)
- StudyGroup (quản lý nhóm học)

# Controller mới:
- language_exchanges_controller
- community_comments_controller
- study_groups_controller
```

**Công việc Frontend**:
```tsx
# Trang mới:
- /app/community          — Khám phá người dùng & nhóm
- /app/exchange/[userId] — Hồ sơ trao đổi
- /app/groups            — Duyệt & tham gia nhóm
```

**Nỗ lực**: 3–4 tuần | **Ưu tiên**: 🟡 Trung bình | **Chướng ngại vật**: Chính sách kiểm duyệt

---

### Q4 2026 (Tháng 11–1) — Kiếm tiền & Hoàn thiện

#### Sprint 4.1: Các Tier tính năng VIP (Tuần 1–4)
**Mục tiêu**: Kiếm tiền từ các tính năng cao cấp

**Các Tier**:
- **Miễn phí**: Kiến thức cơ bản (5 giải thích từ vựng/ngày, SRS bị giới hạn)
- **VIP Bronze** ($5/tháng): Giải thích không giới hạn, phân tích nâng cao
- **VIP Silver** ($10/tháng): + Đường dẫn học được cá nhân hóa, hỗ trợ ưu tiên
- **VIP Gold** ($20/tháng): + Bài tập ngữ pháp, bài tập nghe, phản hồi bài luận

**Công việc Backend**:
- Thực thi cổng tính năng (kiểm tra trạng thái VIP trước khi cho phép sử dụng)
- Giới hạn sử dụng theo tier
- Tích hợp Stripe/PayPal (xử lý thanh toán)

**Công việc Frontend**:
- UI paywall (nhắc nâng cấp)
- Bảng so sánh tính năng
- Cài đặt → Quản lý đăng ký

**Nỗ lực**: 2–3 tuần | **Ưu tiên**: 🟡 Trung bình | **Chướng ngại vật**: Thiết lập xử lý thanh toán

---

#### Sprint 4.2: Phrasebook & Biểu thức (Tuần 2–4)
**Mục tiêu**: Học cụm từ bối cảnh

**Tính năng**:
- [ ] 1,000+ cụm từ theo tình huống (chào hỏi, mua sắm, kinh doanh, du lịch)
- [ ] Âm thanh phát âm
- [ ] Ghi chú sử dụng (chính thức vs. thân mật, khi nào sử dụng)
- [ ] Tích hợp flashcard
- [ ] Tìm kiếm & lọc theo bối cảnh

**Dữ liệu**: Điền sẵn từ các cơ sở dữ liệu cụm từ JLPT mã nguồn mở

**Nỗ lực**: 2 tuần | **Ưu tiên**: 🟢 Thấp | **Chướng ngại vật**: Không

---

#### Sprint 4.3: Phân tích nâng cao & Thông tin chi tiết (Tuần 3–6)
**Mục tiêu**: Giúp người dùng theo dõi tiến độ

**Tính năng**:
- [ ] Biểu đồ tiến độ chi tiết (theo cấp độ, danh mục, kỹ năng)
- [ ] Phát hiện khu vực yếu ("Bạn đang gặp khó khăn với hạt N3")
- [ ] Ước tính thời gian thành thạo ("Ước tính 6 tháng để đạt N2")
- [ ] Công cụ suy luận (đề xuất chủ đề tiếp theo)
- [ ] So sánh với nhóm (ẩn danh; tùy chọn)
- [ ] Xuất báo cáo tiến độ (PDF)

**Nỗ lực**: 2 tuần | **Ưu tiên**: 🟢 Thấp | **Chướng ngại vật**: Hiệu suất tổng hợp dữ liệu

---

### 2027+ (Năm 2) — Mở rộng & Khác biệt

#### Tính năng tương lai (Ý tưởng sơ bộ)

1. **Phản hồi bài luận/sáng tác**
   - Người dùng viết bài luận tiếng Nhật → Claude xem xét ngữ pháp/kanji/luồng
   - Gợi ý cải tiến
   - Chi phí cao trên mỗi yêu cầu; cần mô hình định giá

2. **Tích hợp phương tiện**
   - Các bài báo tin tức ngắn (với furigana, tra từ)
   - Đọc manga snippet (thực hành với nội dung thực)
   - Clip phim/anime (với phụ đề)
   - Phiên bản podcast (nghe + đọc)

3. **Độ khó thích ứng**
   - Hệ thống dựa trên ML điều chỉnh độ khó trong thời gian thực
   - Đường dẫn học tập được cá nhân hóa (tránh chán + chán)
   - Dự đoán khu vực yếu trước khi người dùng gặp khó khăn

4. **Bảng điều khiển giáo viên**
   - Giáo viên quản lý học sinh
   - Tạo bài tập (mục tiêu ngữ pháp/từ vựng cụ thể)
   - Theo dõi tiến độ lớp

5. **Nội dung hợp tác**
   - Bài kiểm tra JLPT chính thức (bài thi xác thực)
   - Tích hợp NHK Easy News
   - Nội dung manga/anime được cấp phép

---

## 📊 Thước đo thành công

Theo dõi những điều này để xác thực ưu tiên tính năng:

| Thước đo | Mục tiêu | Phép đo |
|----------|----------|--------|
| **Tăng trưởng DAU** | +50% Năm | Google Analytics |
| **Áp dụng tính năng nghe** | 60% trong 3 tháng | Phân tích cờ tính năng |
| **Tỷ lệ chuyển đổi VIP** | 5–10% | Dữ liệu Stripe |
| **Thời lượng phiên trung bình** | 30 phút | Analytics |
| **Retention (7 ngày)** | 40%+ | Phân tích nhóm |
| **Tỷ lệ vượt JLPT của người dùng** | 70% người dùng N2+ vượt JLPT | Khảo sát |
| **NPS** | 40+ | Khảo sát hàng quý |

---

## 🛠️ Hướng dẫn triển khai

### Thực hành kỹ thuật
- **Cờ tính năng**: Sử dụng để quăng từng bước (ví dụ: 10% → 50% → 100% người dùng)
- **Kiểm tra A/B**: So sánh các biến thể UI để tăng sự tham gia
- **Hiệu suất**: Mục tiêu <3s tải trang; <500ms phản hồi API
- **Kiểm tra**: Nhắm đạt 70%+ độ bao phủ mã (kiểm tra đơn vị + tích hợp)
- **Giám sát**: Cảnh báo về lỗi, độ trễ API, áp dụng tính năng

### Thiết kế & UX
- Giữ mobile-first (80%+ người học dùng điện thoại)
- Khả năng truy cập: Tuân thủ WCAG AA (độ tương phản màu, trình đọc màn hình)
- Onboarding: <2 phút để đạt giá trị đầu tiên (giải thích trò chơi ngay lập tức)
- Vòng lặp phản hồi: Hiển thị kết quả ngay lập tức (streak, chính xác %)

### Quản lý sản phẩm
- **Phỏng vấn người dùng**: Hội thoại hàng tháng với 5–10 người dùng
- **Vòng phản hồi**: Widget phản hồi trong ứng dụng
- **Phân tích**: Theo dõi áp dụng tính năng, điểm rơi
- **Ưu tiên**: Tiếng nói người dùng > lộ trình > ý tưởng kỹ sư

---

## 📝 Danh sách kiểm tra triển khai

### Trước khi bắt đầu bất kỳ tính năng nào
- [ ] Định nghĩa thước đo thành công
- [ ] Tạo vé JIRA với tiêu chí chấp nhận
- [ ] Thiết kế mockup UI (Figma)
- [ ] Lên kế hoạch mô hình dữ liệu (ERD)
- [ ] Ước tính nỗ lực (điểm story)
- [ ] Xác định chướng ngại vật & phụ thuộc

### Trong quá trình phát triển
- [ ] Viết bài kiểm tra (TDD khi có thể)
- [ ] Đánh giá mã (2+ nhà phê duyệt)
- [ ] Kiểm tra hiệu suất (kiểm tra tải nếu cần)
- [ ] Kiểm tra khả năng truy cập (WCAG)
- [ ] Tài liệu (API docs, hướng dẫn UX)

### Trước khi phát hành
- [ ] Kiểm tra QA (dev + staging)
- [ ] Thiết lập giám sát (theo dõi lỗi, phân tích)
- [ ] Cờ tính năng sẵn sàng (tùy chọn quăng tối tối)
- [ ] Tài liệu người dùng (bài viết trợ giúp, video)
- [ ] Sẵn sàng tiếp thị (media xã hội, email)

### Sau khi phát hành
- [ ] Giám sát áp dụng & lỗi (hàng ngày)
- [ ] Tập hợp phản hồi người dùng (khảo sát hàng tuần)
- [ ] Tối ưu hóa dựa trên dữ liệu (sprint hàng tuần)
- [ ] Kế hoạch lặp lại tiếp theo (hợp rút gọn lưỡng tuần)

---

## 💰 Ước tính ngân sách (Hàng năm)

| Tính năng | Thời gian Dev | Cơ sở hạ tầng | Tổng cộng |
|-----------|---------|-----------|--------|
| Nghe | 3–4 tuần | $500/tháng (API TTS) | $8K |
| Bài tập ngữ pháp | 2–3 tuần | — | $4K |
| Luyện viết kanji | 2–3 tuần | — | $4K |
| Ứng dụng di động | 4–6 tuần | $200/tháng | $6K |
| Tính năng cộng đồng | 3–4 tuần | $1K/tháng | $8K |
| Kiếm tiền VIP | 2–3 tuần | Phí Stripe | $4K |
| **Tổng cộng (Năm 1)** | ~4–6 tháng | ~$2K/tháng | **$40–50K** |

*Lưu ý: Giả định 2–3 FTE kỹ sư + 1 quản lý sản phẩm*

---

## 🎓 Kết luận

**Tóm tắt ưu tiên**:
1. **Q2 2026**: Nghe + Bài tập ngữ pháp (bao gồm khoảng trống JLPT)
2. **Q3 2026**: Ứng dụng di động + Cộng đồng (tăng sự tham gia)
3. **Q4 2026**: Kiếm tiền VIP + Hoàn thiện (doanh thu + retention)
4. **2027+**: Hợp tác nội dung + AI học thích ứng (sự khác biệt)

Lộ trình này cân bằng:
- ✅ Nhu cầu người dùng (phủ JLPT tốt hơn)
- ✅ Mục tiêu kinh doanh (kiếm tiền, tăng trưởng)
- ✅ Nợ kỹ thuật (di động, hiệu suất)
- ✅ Định vị cạnh tranh (vs. Duolingo, gia sư)

**Thành công = Người dùng đi từ N5 → N2 → N1 với tự tin & niềm vui** 🎉

---

*Câu hỏi? Gợi ý? Cập nhật tài liệu này khi ưu tiên thay đổi.*
