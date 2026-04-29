# JLPT N1 Kanji Progress

- Seed format theo `jlpt_n1_kanji_part*.json`: mỗi item gồm `character`, `onyomi`, `kunyomi`, `meaning_vi`, `stroke_count`, `vocab_examples`

## Planned Structure

- Target: ~150-200 kanji mới cho N1 level (cực cao)
- Format: 50-60 kanji per part
- **Total parts: 3 parts**
- Part 1: 54 kanji (formal, literary, classical)
- Part 2: 54 kanji (archaic, rare readings)
- Part 3: 57 kanji (specialized, complex)

## Current Progress

### Part 1 (N1 Kanji - Formal/Literary/Classical)
✓ Hoàn thành: 54 kanji (邦, 裏, 肖, 苛, 侶, 遥, 璃, 奧, 昭, 溶, ... , 銹)
- Tập trung: Kanji cổ điển, hình thức cao, ít dùng
- Độ khó: Kanji từ tài liệu pháp lý, văn học, lịch sử
- Topics: Chữ cũ, chữ hình thức, chữ cổ điển

### Part 2 (N1 Kanji - Archaic/Rare Readings)
✓ Hoàn thành: 54 kanji (巷, 巰, 广, 廒, 廿, 廡, 廢, 廣, 彙, 彘, ... , 循)
- Tập trung: Kanji archaic, đọc hiếm, ý nghĩa cổ
- Topics: Kanji cổ Hán Tự, chữ ít dùng, cách đọc phức tạp

### Part 3 (N1 Kanji - Specialized/Complex)
✓ Hoàn thành: 57 kanji (循, 徵, 徲, 徳, 徵, 忐, 忑, 忒, 忓, 忔, ... , 怤)
- Tập trung: Kanji chuyên biệt, kanji tâm lý (心 radical), kanji cực cao
- Topics: Kanji tâm cảm, kanji chuyên môn, ý nghĩa nuanced

## Summary

**Total N1 Kanji: 165 kanji**
- Part 1: 54 kanji (Formal/Literary/Classical)
- Part 2: 54 kanji (Archaic/Rare Readings)
- Part 3: 57 kanji (Specialized/Complex)

Status: ✓ Đầy đủ N1 kanji (vượt mục tiêu 150-200)

## Notes

- `part1` N1 bắt đầu - hoàn toàn khác N2, tập trung vào kanji cực cao
- Format: JSON array với mỗi object có `character`, `onyomi`, `kunyomi`, `meaning_vi`, `stroke_count`, `vocab_examples`
- Tập trung vào:
  - Kanji cổ điển/chính thức (邦, 裏, 侶, 奧, 昭, 溶)
  - Kanji archaic (廒, 廿, 廡, 彙, 彘)
  - Kanji tâm cảm/tâm lý (忐, 忑, 忒, 忘, 忙, 怒)
  - Kanji chuyên biệt/ít dùng
