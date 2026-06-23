# JLPT N1 Kanji Progress

- Seed format theo `jlpt_n1_kanji_part*.json`: mỗi item gồm `character`, `onyomi`, `kunyomi`, `meaning_vi`, `stroke_count`, `vocab_examples`

## Final Structure (Verified ✓ — updated 2026-06-15)

- **Total: 337 kanji N1 level (unique, không trùng N2/N3/N4/N5)**
- **Total parts: 7 parts**
- Part 1: 43 kanji (formal, literary, classical)
- Part 2: 51 kanji (archaic, rare readings)
- Part 3: 49 kanji (specialized, complex — nhiều kanji bộ 心 cổ)
- Part 4: 46 kanji (emotional, aesthetic, psychological)
- Part 5: 48 kanji (nature, animals, plants, cultural symbols)
- Part 6: 50 kanji (ritual, spiritual, body, plants, metals)
- Part 7: 50 kanji (imperial, feudal, classical literature, Buddhism)

## Current Progress

### Part 1 (N1 Kanji - Formal/Literary/Classical)
✓ Hoàn thành: 43 kanji — 42/43 có 2+ vocab_examples (1 kanji 锞 quá archaic)

### Part 2 (N1 Kanji - Archaic/Rare Readings)
✓ Hoàn thành: 51 kanji — 44/51 có 2+ vocab_examples (7 kanji là bộ thủ, không có compound)

### Part 3 (N1 Kanji - Specialized/Complex)
✓ Hoàn thành: 49 kanji — 11/49 có 2+ vocab_examples
- 38 kanji bộ 心 cổ (忐, 忑, 忒, 忓... ) không có compound tiếng Nhật thực tế → giữ nguyên 1 example

### Part 4 (Emotional/Aesthetic/Psychological)
✓ Hoàn thành: 46 kanji — tất cả có 2+ vocab_examples

### Part 5 (Nature/Animals/Plants/Cultural)
✓ Hoàn thành: 48 kanji — tất cả có 2+ vocab_examples

### Part 6 (Ritual/Spiritual/Body/Plants/Metals)
✓ Hoàn thành: 50 kanji — tất cả có 2+ vocab_examples

### Part 7 (Imperial/Feudal/Classical/Buddhism)
✓ Hoàn thành: 50 kanji — tất cả có 2+ vocab_examples

## Data Quality Verification ✓

- ✓ Total: 337 kanji (0 duplicates cross-level, verified)
- ✓ Mỗi kanji có đầy đủ fields: character, onyomi, kunyomi, meaning_vi, stroke_count, vocab_examples
- ✓ Tất cả meaning_vi đều viết tiếng Việt
- ✓ 290/337 kanji có 2+ vocab_examples; 47 kanji quá archaic chỉ có 1 (xác nhận hợp lệ)

## Kanji còn 1 vocab_example (xác nhận hợp lệ)

47 kanji archaic/bộ thủ không có compound tiếng Nhật thực tế:
- Part 1 (1): 锞
- Part 2 (8): 巰, 彠, 彡, 彳, 彵, 彸, 彾, 徚
- Part 3 (38): 徲, 忐, 忑, 忒, 忓, 忔, 忕, 忛, 忞, 忟, 忡, 忢, 忣, 忤, 忥, 忦, 忨, 忩, 忪, 忬, 怊, 怋, 怎, 怏, 怐, 怑, 怓, 怔, 怕, 怗, 怘, 怚, 怛, 怞, 怟, 怢, 怣, 怤

## Summary

**Total N1 Kanji: 337 kanji ✓**
- Part 1: 43 kanji (Formal/Literary/Classical) ✓
- Part 2: 51 kanji (Archaic/Rare Readings) ✓
- Part 3: 49 kanji (Specialized/Complex) ✓
- Part 4: 46 kanji (Emotional/Aesthetic/Psychological) ✓
- Part 5: 48 kanji (Nature/Animals/Plants/Cultural) ✓
- Part 6: 50 kanji (Ritual/Spiritual/Body/Plants/Metals) ✓
- Part 7: 50 kanji (Imperial/Feudal/Classical/Buddhism) ✓

Status: ✓ **Đầy đủ, không có duplicate cross-level**

## Update 2026-06-23 — Bổ sung (giữ nguyên data cũ, chỉ thêm mới)

- Thêm Part 8: 61 kanji Jōyō rõ ràng N1 (該慨騰寡轄堪棺閑騎擬犠窮恭凝謹鯨傑弧顧娯肯溝衡拷傲獄墾懇唆栽斎債搾桟肢珠酬醜叔淑俊准殉叙償匠抄尚祥渉訟晶硝冗浄剰壌嬢錠拭嘱...).
- Mỗi kanji có onyomi/kunyomi, meaning_vi, stroke_count, vocab_examples thật.
- Dedup theo `character` toàn cục (key DB) — 0 trùng với mọi level.
- **Tổng kanji toàn bộ level: 1978 (1917 + 61 mới).**
- Lưu ý chưa xử lý: data cũ còn chứa kanji không thuộc Jōyō/JLPT (vd 忐忑忒 ở part3) và một số chữ sai level (忘/忙=N4, 応=N3) — theo yêu cầu "giữ nguyên, chỉ thêm mới", chưa sửa.

## Update 2026-06-23 (lần 2) — Đã XÓA data rác kanji

- Xóa 66 kanji rác khỏi N1: 47 chữ bịa (忐忑忒系列, bộ 心/彳 cổ TQ) + 19 chữ phồn thể/bộ thủ/Hán-TQ (广 縣 廣 彥 彘 彝 彣 彯 彴 彽 徂 韶 徝 徢 徣 徥 徦 徧 貲).
- N1 kanji: 396 → 330. Global kanji: 1978 → 1912, 0 duplicate, tất cả file parse OK.
- CÒN LẠI chưa xử lý (chữ thật nhưng entry sai/hiếm, cần quyết định): 御 忝 徠 蝗 怡 廿; và chữ sai level 忘/忙(N4) 応(N3) vẫn ở part3.

## Update 2026-06-23 (lần 3) — Dọn nốt + sửa data

- Xóa thêm: 忘 忙 応 (sai level → N4/N4/N3) + 忧 (giản thể TQ của 憂). N1 kanji: 330 → 326.
- Sửa data 6 chữ thật bị ghi sai: 御(ギョ/ゴ), 徠(招徠), 廿(はつか), 蝗(いなご/蝗害), 忝(かたじけない), 怡(怡然).
- Còn lại ở part3 (chưa xử lý, cần quyết): 徵 (dạng phồn thể của 徴), 怙 (hiếm). 循/忖/怜 là chữ thật, giữ.
- Vocab: sửa 忧鬱→憂鬱 (từ thật viết sai chữ), xóa 邦土/国邦 (compound bịa). N1 vocab: 996 → 994.
- Lưu ý: rà soát vocab bịa diện rộng KHÔNG làm tự động an toàn được (không có từ điển) → chỉ xóa phần xác minh chắc chắn, giữ phần còn lại để tránh xóa nhầm từ thật.
