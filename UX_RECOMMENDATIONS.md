# Khuyến nghị UX & UI — Ứng dụng học tiếng Nhật

**Chuẩn bị**: 5 tháng 5, 2026  
**Đối tượng**: Các nhóm sản phẩm, thiết kế và kỹ thuật

---

## 🎨 Đánh giá trạng thái hiện tại

### Điểm mạnh
- ✅ Thiết kế sạch, hiện đại (Tailwind CSS)
- ✅ Điều hướng trực quan (thanh bên trái, breadcrumb)
- ✅ Responsive trên tablet/máy tính để bàn
- ✅ Sử dụng emoji tốt (giảm rào cản ngôn ngữ cho người dùng không phải tiếng Anh)
- ✅ Mã hóa màu theo cấp độ JLPT (N5 xanh lá → N1 tím)

### Điểm yếu
- ❌ Trải nghiệm di động không tối ưu (không thân thiện với cảm ứng)
- ❌ Một số loading skeleton không nhất quán
- ❌ Thiếu minh họa trạng thái trống (các khung trống cảm thấy nhàm chán)
- ❌ Thiếu tooltip trợ giúp (SRS-2 là gì? "ease factor" là gì?)
- ❌ Khoảng cách & căn chỉnh không nhất quán ở một số nơi
- ❌ Không có chế độ tối
- ❌ Trang ngữ pháp trông thưa thớt (không có phân cấp trực quan)

---

## 📱 Cải tiến Mobile-First

### Ưu tiên 1: Tinh chỉnh Responsive

#### Vấn đề
Dashboard trên điện thoại bị chật; lưới từ vựng khó nhấn.

#### Giải pháp

**1. Xếp liên kết nhanh theo chiều dọc trên màn hình nhỏ**
```tsx
// Hiện tại: grid-cols-3 (3 cột)
// Tốt hơn:   grid-cols-2 trên di động, grid-cols-3 trên máy tính bảng, grid-cols-6 trên máy tính để bàn
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
```

**2. Tab toàn chiều rộng cho chế độ học**
Trang xem xét hiện tại có các nút nhỏ. Làm cho chúng toàn chiều rộng trên di động:
```tsx
// Di động: Toàn chiều rộng, xếp chồng
// Máy tính để bàn: Side-by-side
<div className="flex flex-col sm:flex-row gap-4">
```

**3. Thanh điều hướng dưới cùng (Di động)**
Thay vì thanh bên, hiển thị thanh điều hướng dính ở dưới cùng trên điện thoại:
```tsx
// Chỉ di động thanh dính dưới với 5 tính năng chính:
// 📖 Từ vựng | 📝 Ngữ pháp | 🎤 Hội thoại | 📰 Đọc | 🎯 Xem xét
```

#### Tác động
- Điều hướng dễ dàng hơn dựa trên ngón tay cái
- Nhanh hơn 20% trên di động
- Tốt hơn cho màn hình nhỏ

---

### Ưu tiên 2: Tối ưu hóa cảm ứng

#### Vấn đề
Các nút quá nhỏ; các trạng thái hover không thân thiện với cảm ứng.

#### Giải pháp

**1. Tăng mục tiêu cảm ứng nút**
Hướng dẫn WCAG: tối thiểu 44×44px
```tsx
// Hiện tại: py-2 px-3 (quá nhỏ)
// Tốt hơn: py-3 px-4 tối thiểu trên di động
<button className="py-3 px-4 md:py-2 md:px-3">
```

**2. Xem xét flashcard dựa trên vuốt**
Cho phép vuốt trái/phải để xếp hạng thẻ (thay vì nhấp các nút nhỏ):
```tsx
// Vuốt trái = "Quên", phải = "Dễ"
<Gesture onSwipeLeft={() => rate(0)} onSwipeRight={() => rate(5)} />
```

**3. Nhấp đôi để tiết lộ flashcard**
Trực quan hơn so với nhấp nút:
```tsx
<div onDoubleClick={() => setRevealed(!revealed)} className="cursor-pointer">
  {revealed ? <Back /> : <Front />}
</div>
```

---

### Ưu tiên 3: Tích hợp bàn phím di động

#### Vấn đề
Đầu vào tiếng Nhật khó chịu trên trình duyệt di động.

#### Giải pháp

**1. Gợi ý các hạt phổ biến** (bài tập ngữ pháp)
```tsx
// Thay vì gõ, hãy để người dùng chọn từ các nút:
<div className="flex gap-2 flex-wrap">
  {["は", "が", "を", "に"].map(p => 
    <button onClick={() => addParticle(p)}>{p}</button>
  )}
</div>
```

**2. Gợi ý bàn phím Hiragana**
Hiển thị reading phía trên các chỗ trống trong bài tập điền chỗ trống:
```tsx
{/* Người dùng thấy: 私__学校に行きます */}
{/* Gợi ý phía trên: わたし __ がっこう に いきます */}
```

**3. Đầu vào thoại cho luyện nghe**
Cho phép người dùng nói câu trả lời thay vì gõ (khả năng truy cập + dễ dàng):
```tsx
<button onClick={startVoiceRecording}>🎤 Phát âm câu trả lời</button>
```

---

## 🎓 Onboarding & Hướng dẫn

### Vấn đề
Người dùng mới không biết SRS là gì, tại sao streak quan trọng, hoặc cách sử dụng giải thích ngữ pháp.

### Giải pháp

#### 1. Tour Onboarding Interactive (2 lần ghé thăm đầu tiên)
```tsx
// Sử dụng react-joyride hoặc tương tự
Các bước tour:
1. "Chào mừng! Đây là bảng điều khiển của bạn. Thanh xanh lá hiển thị tiến độ JLPT của bạn."
2. "Ngọn lửa 🔥 này là streak học tập của bạn. Học mỗi ngày để giữ nó còn sống!"
3. "Nhấp 'Từ vựng' để bắt đầu học các từ."
4. "Hãy thử 'Flashcard' để xem xét các từ bạn đã học."
```

#### 2. Tooltip Thuật ngữ Glossary
Thêm tooltip di chuột cho jargon:
```tsx
<span className="relative group cursor-help">
  SRS
  <span className="absolute hidden group-hover:block bg-gray-900 text-white p-2 rounded text-xs">
    Hệ thống Spaced Repetition — xem xét các từ theo khoảng thời gian để tăng cường bộ nhớ
  </span>
</span>
```

#### 3. Minh họa trạng thái trống
Khi người dùng không có từ vựng để xem xét, hãy hiển thị:
```
📚 Không có từ vựng nào!
Bắt đầu bằng cách khám phá các từ mới, sau đó quay lại đây để xem lại chúng.
[← Đi đến từ vựng]
```

#### 4. Video trợ giúp ngữ cảnh
GIF ngắn (10–30 giây) hiển thị cách sử dụng từng tính năng:
```tsx
<Video src="/help/how-to-flashcard.gif" autoPlay loop muted />
```

---

## 🎯 Cải tiến Dashboard

### Vấn đề
Dashboard hiển thị thống kê, nhưng không có rõ ràng "phải làm gì tiếp theo?"

### Giải pháp

#### 1. Mục tiêu của Bạn Tiếp theo
```tsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
  <h3>Các bước tiếp theo của bạn</h3>
  <ul className="list-disc ml-5 text-sm">
    <li>📖 Xem lại 5 từ vựng (hôm nay)</li>
    <li>✍️ Luyện tập hạt N3 (bạn yếu ở đây)</li>
    <li>🎤 Làm một bài tập hội thoại (cấp độ N5)</li>
  </ul>
</div>
```

#### 2. Dự đoán tiến độ
```tsx
<div className="bg-green-50 p-4 rounded">
  <p className="font-semibold">📈 Dự đoán tốc độ</p>
  <p className="text-sm text-gray-700">
    Với tốc độ hiện tại của bạn (2 giờ/tuần), bạn sẽ đạt N2 trong ~8 tháng.
  </p>
</div>
```

#### 3. Huy hiệu thành tựu (Gamification)
Thay vì chỉ số streak:
```
🏅 Cột mốc được mở khóa!
Bạn đã học 500 từ. Bạn đã sẵn sàng cho bài tập kiểm tra N4.
```

---

## 📖 Cải tiến trang đọc

### Vấn đề hiện tại
Khung đọc là đồng nghĩa với sự rối loạn; khó theo dõi cho người mới bắt đầu.

### Giải pháp

#### 1. Toggle hiển thị Furigana
```tsx
<label className="flex items-center gap-2">
  <input type="checkbox" defaultChecked onChange={toggleFurigana} />
  <span>Hiển thị furigana cho tất cả kanji</span>
</label>

{/* Nếu được bật: */}
{showFurigana && <ruby>漢字<rt>かんじ</rt></ruby>}
{/* Nếu bị tắt: */}
{!showFurigana && <span>漢字</span>}
```

#### 2. Phát âm từng từ
Nhấp vào bất kỳ từ nào → nghe phát âm gốc:
```tsx
<span 
  className="cursor-pointer hover:bg-yellow-100" 
  onClick={() => playAudio(word)}
>
  Nhấn tôi để nghe
</span>
```

#### 3. Thanh bên từ vựng trong khi đọc
Hiển thị tất cả các từ không biết trong bảng điều khiển bên trái (với âm thanh + nghĩa):
```tsx
// Phải: Bài viết đọc
// Trái: Các từ không biết
// Người dùng nhấp vào từ → định nghĩa xuất hiện, âm thanh phát
```

#### 4. Điều chỉnh tốc độ đọc
Một số văn bản quá nhanh; cho người dùng:
```tsx
<select onChange={(e) => setSpeed(e.target.value)}>
  <option value="0.75">Chậm (0.75x)</option>
  <option value="1">Bình thường</option>
  <option value="1.25">Nhanh (1.25x)</option>
</select>
```

---

## 📝 Cải tổ trang ngữ pháp

### Vấn đề hiện tại
Danh sách ngữ pháp là đơn giản; giải thích không thu hút người dùng.

### Giải pháp

#### 1. Thẻ ngữ pháp trực quan
Thay vì danh sách đơn giản, hãy hiển thị mẫu với nhãn màu:
```
┌─────────────────────────────────┐
│ 〜ことができる                  │ N4
│ có thể / có thể                │
│                                 │
│ 私は日本語を話すことができます。│
│ Tôi có thể nói tiếng Nhật.     │
│                                 │
│ [📝 Giải thích] [✍️ Bài tập] [🔄 Xem xét]
└─────────────────────────────────┘
```

#### 2. Sắp xếp gia đình ngữ pháp
Các mẫu liên quan nhóm:
```
🌳 Gia đình ngữ pháp: Nguyên nhân & Hiệu ứng
├── 〜から (N5) — vì nguyên do
├── 〜ので (N4) — bởi vì (chính thức hơn)
├── 〜のに (N3) — mặc dù, bất chấp
└── 〜せいで (N3) — do (tiêu cực)

[Hiển thị mối quan hệ trực quan với mũi tên]
```

#### 3. Công cụ xây dựng câu
Kéo thành phần để xây dựng câu:
```
[Tôi là] [cuốn sách] [đọc] [có thể]
   ↓      ↓     ↓       ↓
chủ ngữ đối tượng động từ phụ trợ
```

#### 4. Chỉ báo khó độ mẫu
Chỉ báo trực quan về khó độ hiếm gặp:
```
Phổ biến (100%+ người dùng biết)     ████████░░
Trung bình (50% người dùng biết)     ████░░░░░░
Hiếm (10% người dùng biết)           ██░░░░░░░░
```

---

## 🎙️ Đánh bóng tính năng hội thoại

### Vấn đề hiện tại
Giao diện trò chuyện cảm thấy giống như Q&A cơ bản, không phải hội thoại thực tế.

### Giải pháp

#### 1. UI thực tế
Làm cho nó trông giống một ứng dụng trò chuyện thực sự:
```
┌──────────────────────────────────┐
│ 👩‍🏫 Gia sư                        │
│ Hãy nói về ngày hôm nay của bạn!│
│ Bạn đã làm gì hôm nay?           │
│                                  │
│    [Bạn vừa xong]               │
│ 今日は仕事をしました。            │
│                                  │
│ 👩‍🏫 Gia sư (vừa xong)              │
│ Tốt! Loại công việc nào?        │
│ 仕事は何ですか？                 │
│ [📖 Học] [🎧 Nghe] [⏸ Chậm]│
└──────────────────────────────────┘
[Gõ ở đây... | 🎤 Phát âm]
```

#### 2. Chỉ báo gõ
Hiển thị khi AI "suy nghĩ" (thực tế):
```
👩‍🏫 Gia sư đang gõ...
```

#### 3. Sửa lỗi
Sửa lỗi trong hội thoại:
```
Bạn: 私は学生です。
👩‍🏫: Hoàn hảo! Nhưng bạn cũng có thể nói "僕は学生です" (ít chính thức hơn)
```

#### 4. Ngữ cảnh kịch bản
Hiển thị tình huống trực quan:
```
🏪 Bạn ở một cửa hàng tiện lợi. Hỏi mua sữa.
```

---

## 🌙 Hỗ trợ chế độ tối

### Triển khai
Thêm bộ chuyển đổi chủ đề trong cài đặt:
```tsx
// app/layout.tsx
const [theme, setTheme] = useState<'light' | 'dark'>('light');

<html className={theme === 'dark' ? 'dark' : ''}>
  {/* Sử dụng tiền tố tối tailwind: */}
</html>
```

Lợi ích:
- Giảm căng thẳng mắt (đặc biệt là cho những người học buổi tối)
- Tiết kiệm pin hơn trên màn hình OLED
- Kỳ vọng người dùng hiện đại

---

## 🎨 Hệ thống màu & thiết kế

### Bảng màu hiện tại
```
Chính:   Indigo-600 (xanh)
Thành công:   Xanh lá cây-600 (tiến độ)
Cảnh báo:   Amber-500 (cảnh báo)
Lỗi:     Đỏ-600 (lỗi)
```

### Cải tiến

#### 1. Mã hóa màu cấp độ JLPT (Nhất quán)
```
N5 → Xanh lá cây    (người mới bắt đầu)
N4 → Xanh           (trung gian)
N3 → Vàng           (trung gian cao)
N2 → Cam            (nâng cao)
N1 → Tím            (thành thạo)
```
Sử dụng chúng **ở mọi nơi** (thẻ, thanh tiến độ, huy hiệu)

#### 2. Chỉ báo khó
```
👶 Dễ      → Xanh
😐 Trung bình    → Xanh
😰 Khó      → Cam
😱 Rất khó → Đỏ
```

#### 3. Khoảng trắng & Không gian thở
Thêm lề giữa các phần (hiện tại quá chật):
```css
.section { margin-bottom: 2rem; } /* là 1rem */
.card    { padding: 1.5rem; }     /* là 1rem */
```

---

## ♿ Cải tiến khả năng truy cập

### Khoảng trống hiện tại
- Thiếu nhãn ARIA trên các biểu tượng
- Chỉ các chỉ báo màu (đỏ = lỗi, nhưng không có văn bản)
- Điều hướng bàn phím không hoàn chỉnh

### Giải pháp

#### 1. Alt Text & ARIA
```tsx
<button aria-label="Đọc bài viết to tiếng" title="Text-to-speech">
  🔊
</button>
```

#### 2. Chỉ báo tiêu điểm
Làm cho những người dùng bàn phím thấy những gì được chọn:
```css
.button:focus {
  outline: 2px solid indigo-600;
  outline-offset: 2px;
}
```

#### 3. Chỉ báo màu + biểu tượng/văn bản
```tsx
// Xấu: chỉ nền đỏ
// Tốt: nền đỏ + ❌ biểu tượng + "Lỗi" văn bản
<div className="bg-red-100 text-red-700">
  ❌ Câu trả lời không chính xác
</div>
```

#### 4. Nhãn biểu mẫu
Tất cả các đầu vào phải có nhãn có thể nhìn thấy (không chỉ trình giữ chỗ):
```tsx
<label htmlFor="word">Từ trong tiếng Nhật</label>
<input id="word" type="text" placeholder="ví dụ: 好き" />
```

---

## 📊 Phân tích & Theo dõi (Không xâm phạm)

### Những gì cần đo lường
```
Lượt xem trang:
- Tính năng được truy cập nhiều nhất
- Áp dụng tính năng theo thời gian
- Điểm rơi (nơi người dùng rời đi)

Sự tham gia:
- Thời gian dành cho mỗi tính năng
- Tần suất chuyển đổi tính năng
- Thời lượng phiên

Học tập:
- Độ chính xác bài quiz theo mẫu ngữ pháp
- Hiệu suất SRS (người dùng giữ chân bao nhiêu)
- Tốc độ tiến bộ cấp độ

Kiếm tiền:
- Tỷ lệ chuyển đổi VIP
- Các tương tác cổng thanh toán
- Tỷ lệ thành công thanh toán
```

### Cách tiếp cận ưu tiên quyền riêng tư
- Sử dụng ID ẩn danh
- Không theo dõi người dùng trên các trang web của bên thứ ba
- Chính sách bảo mật rõ ràng
- Tùy chọn từ chối phân tích

---

## 📱 Chiến lược thông báo

### Email
- **Tóm tắt hàng tuần** (Thứ hai 9 sáng): "Bạn đã học 20 từ tuần này!"
- **Nhắc nhở xem xét** (nếu khoảng > 3 ngày): "Bạn có 15 từ vựng để xem xét"
- **Thành tựu**: "Bạn đạt được streak 30 ngày!"

### Trong ứng dụng
- **Xem xét hết hạn**: Huy hiệu nổi trên bảng điều khiển ("5 xem xét hết hạn")
- **Cột mốc**: Biểu ngữ ăn mừng ("Bạn đã học 500 từ!")

### Đẩy (Di động)
- **Lời nhắc hàng ngày** (opt-in): "Đã đến lúc 10 phút tiếng Nhật?"
- **Xem xét khẩn cấp**: "3 mục từ vựng hết hạn hôm nay!"

**Chìa khóa**: Làm cho thông báo hữu ích, không phiền. Tôn trọng tùy chọn người dùng.

---

## 🧪 Ý tưởng kiểm tra A/B

Kiểm tra những điều này để tối ưu hóa sự tham gia:

| Bài kiểm tra | Biến thể A | Biến thể B | Thước đo thành công |
|------|-----------|-----------|----------------|
| **Streak Reset** | Tự động đặt lại khi bỏ qua ngày | Không tự động đặt lại (người dùng kéo dài) | Retention |
| **Màu nút xem xét** | Xanh | Đỏ | Tỷ lệ nhấp chuột |
| **Loại bài tập ngữ pháp** | Fill-blank | Lựa chọn nhiều | Độ chính xác |
| **Tốc độ nghe** | 1x (bình thường) | 0.75x (chậm) | Hoàn thành tác vụ |
| **Paywall VIP** | $5/tháng | $10/tháng | Chuyển đổi |
| **Trạng thái trống** | Chỉ văn bản | Minh họa | Tỷ lệ nhấp qua |

---

## 🎬 Danh sách kiểm tra Chiến thắng nhanh (Tháng này)

- [ ] Thêm tooltip "Trợ giúp" trên trang SRS (giải thích ease factor, interval)
- [ ] Tạo minh họa trạng thái trống cho tất cả khung trống
- [ ] Di động: Làm cho nút liên kết nhanh toàn chiều rộng trên điện thoại
- [ ] Chế độ tối toggle trong cài đặt người dùng
- [ ] Thêm phần "Phải làm gì tiếp theo?" vào bảng điều khiển
- [ ] Cải thiện mục tiêu cảm ứng nút (44×44px tối thiểu)
- [ ] Thêm phát âm âm thanh vào giải thích từ vựng
- [ ] Sửa bố cục trang ngữ pháp (phân cấp trực quan tốt hơn)
- [ ] Thêm nhãn ARIA cho tất cả nút biểu tượng
- [ ] Tạo tour onboarding đơn giản (3 bước)

---

## 🎯 Tầm nhìn dài hạn

**Mục tiêu**: Học tiếng Nhật cảm thấy **tự nhiên, hấp dẫn và đáng giá**

### Hành trình người dùng lý tưởng
```
Ngày 1:  Người dùng đăng ký → Tour onboarding → Học 5 từ đầu tiên ✅
Tuần 1: Xem lại từ vựng → Thử bài tập ngữ pháp → Yêu thích streak 🔥
Tháng 1: Hoàn thành bài viết đọc → Vượt qua mini test 🎉
Tháng 3: Đạt cấp độ N3 → Thử chế độ hội thoại 🤖
Tháng 6: Chuẩn bị kỳ thi N2 → Sử dụng tất cả tính năng hàng ngày ✨
Năm 1: Vượt kỳ thi JLPT N2 → Giới thiệu ứng dụng cho bạn bè 🌟
```

**Công việc của chúng tôi**: Loại bỏ ma sát ở mỗi bước. Làm cho học tập cảm thấy dễ dàng.

---

**Cập nhật lần cuối**: 5 tháng 5, 2026  
**Lần xem lại tiếp theo**: Tháng 8, 2026  
**Chủ sở hữu**: Nhóm sản phẩm + thiết kế
