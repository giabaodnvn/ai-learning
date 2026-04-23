# Claude Kit Usage

Tài liệu này hướng dẫn cách dùng bộ `claude-kit` trong repo để Claude có thể:

- đọc RULE code của dự án
- check task trước khi mở PR
- review PR trên GitHub

## 1. Claude Kit là gì

`claude-kit` là một local CLI nằm trong repo tại `claude-kit/`.

Nó làm 3 việc chính:

1. Đọc RULE của dự án từ các file `.md`
2. Lấy context từ GitHub qua `gh` và từ thay đổi code local qua `git diff`
3. Dựng prompt review/check để đưa cho Claude

Mục tiêu là giúp Claude review đúng theo chuẩn của dự án thay vì review chung chung.

## 2. Bộ kit đang đọc RULE từ đâu

Mặc định, kit đang đọc các file sau trong [claude-kit/config.json](/home/baondg/project/ai-learning/claude-kit/config.json:1):

- `CLAUDE.md`
- `frontend/CLAUDE.md`
- `frontend/AGENTS.md`

Nếu sau này team có thêm tài liệu như `docs/RULES.md` hoặc `CONTRIBUTING.md`, chỉ cần thêm path vào `rules_md`.

## 3. Yêu cầu trước khi dùng

Máy local nên có:

- `git`
- `python3`
- `gh`
- tùy chọn: `claude` CLI nếu muốn chạy review thật bằng `--run`

Đăng nhập GitHub CLI:

```bash
gh auth login
```

Kiểm tra nhanh:

```bash
./claude-kit/bin/claude-kit help
```

## 4. Các chức năng hiện có

### `print-rules`

In toàn bộ RULE đang được áp dụng.

```bash
./claude-kit/bin/claude-kit print-rules
```

Dùng khi bạn muốn kiểm tra Claude sẽ đọc những rule nào trước khi review.

### `review-pr <PR_NUMBER>`

Lấy thông tin PR từ GitHub và dựng prompt review.

```bash
./claude-kit/bin/claude-kit review-pr 42
```

Kit sẽ lấy:

- title/body của PR
- file changed
- commit info
- diff của PR
- RULE từ dự án

Kết quả mặc định được ghi ra:

```bash
claude-reviews/pr-42.md
```

Prompt render trung gian được lưu ở:

```bash
claude-kit/output/review-pr-42-prompt.md
```

### `check-task <ISSUE_NUMBER>`

Kiểm tra task local theo GitHub issue.

```bash
./claude-kit/bin/claude-kit check-task 101
```

Kit sẽ lấy:

- title/body/comments của issue
- trạng thái working tree local
- diff chưa commit
- diff đã stage
- file mới chưa track
- RULE của dự án

Kết quả mặc định được ghi ra:

```bash
claude-reviews/task-101.md
```

### `check-task --branch <name>`

Kiểm tra theo branch thay vì issue number.

```bash
./claude-kit/bin/claude-kit check-task --branch feature/add-vocab-index
```

Lúc này kit sẽ so sánh:

```bash
default_branch...branch_name
```

`default_branch` hiện đang lấy từ config và mặc định là `main`.

## 5. Các cờ quan trọng

### `--stdout`

In trực tiếp kết quả ra terminal thay vì ghi file.

Ví dụ:

```bash
./claude-kit/bin/claude-kit review-pr 42 --stdout
./claude-kit/bin/claude-kit check-task 101 --stdout
```

### `--run`

Gửi prompt sang Claude CLI để chạy review/check thật.

Ví dụ:

```bash
./claude-kit/bin/claude-kit review-pr 42 --run
./claude-kit/bin/claude-kit check-task 101 --run
```

Điều kiện:

- máy phải có lệnh `claude`
- nếu command khác tên, sửa trong `claude-kit/config.json`

## 6. Luồng dùng thực tế

### Case 1: Check task trước khi mở PR

Khi bạn đang code xong một task và muốn Claude soát lại:

```bash
git checkout feature/my-task
./claude-kit/bin/claude-kit check-task 101 --run
```

Nếu chưa muốn gọi Claude ngay:

```bash
./claude-kit/bin/claude-kit check-task 101
```

Sau đó mở file output để xem prompt hoặc copy sang công cụ khác.

### Case 2: Review PR đã mở trên GitHub

```bash
./claude-kit/bin/claude-kit review-pr 42 --run
```

Phù hợp khi bạn muốn Claude review như một reviewer nội bộ theo rule của repo.

### Case 3: Chỉ muốn xem Claude đang đọc rule gì

```bash
./claude-kit/bin/claude-kit print-rules
```

Case này hữu ích khi team vừa cập nhật guideline và muốn xác nhận kit đã đọc đúng file.

## 7. Output của kit nằm ở đâu

- Review/task result: `claude-reviews/`
- Prompt render trung gian: `claude-kit/output/`

Hai thư mục này đã được ignore trong git.

## 8. Cách chỉnh cấu hình

File cấu hình: [claude-kit/config.json](/home/baondg/project/ai-learning/claude-kit/config.json:1)

Bạn có thể sửa:

- `rules_md`: danh sách file RULE
- `default_branch`: branch gốc để so sánh
- `outputs`: nơi lưu file output
- `claude.command`: lệnh chạy Claude CLI
- `claude.args`: tham số bổ sung nếu cần

Ví dụ nếu team thêm rule backend riêng:

```json
{
  "rules_md": [
    "CLAUDE.md",
    "frontend/CLAUDE.md",
    "frontend/AGENTS.md",
    "docs/BACKEND_RULES.md"
  ]
}
```

## 9. Một số lưu ý quan trọng

- `review-pr` cần `gh` truy cập được PR trên GitHub
- `check-task` vẫn chạy được ngay cả khi không truyền issue number
- `check-task` có hỗ trợ đọc cả file untracked, nên phù hợp để review trước commit
- Nếu `--run` không chạy, kiểm tra lại xem máy đã cài Claude CLI chưa
- Nếu branch không phải `main`, đổi `default_branch` trong config

## 10. Các lệnh mẫu nên nhớ

```bash
./claude-kit/bin/claude-kit help
./claude-kit/bin/claude-kit print-rules
./claude-kit/bin/claude-kit check-task 101 --run
./claude-kit/bin/claude-kit check-task --branch feature/my-task --run
./claude-kit/bin/claude-kit review-pr 42 --run
```

## 11. Gợi ý cho team

Nếu team muốn dùng bộ kit này ổn định hơn trong ngày thường, nên làm thêm:

- chuẩn hóa file RULE chung của repo
- tách rule backend/frontend rõ hơn
- thống nhất cách viết output review của Claude
- thêm lệnh post review/comment ngược lại GitHub PR

## 12. Tóm tắt ngắn

Nếu chỉ cần nhớ workflow nhanh:

1. Check rule:
```bash
./claude-kit/bin/claude-kit print-rules
```

2. Check task local:
```bash
./claude-kit/bin/claude-kit check-task 101 --run
```

3. Review PR:
```bash
./claude-kit/bin/claude-kit review-pr 42 --run
```
