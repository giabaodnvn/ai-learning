# Claude Kit

Local CLI kit để dựng prompt review cho Claude dựa trên RULE `.md` của dự án và context lấy từ GitHub CLI.

## Mục tiêu

- Review PR từ GitHub bằng `gh`
- Check task/issue cùng với thay đổi local hiện tại
- Tự động nhúng RULE từ các file `.md` của repo
- Có thể chỉ render prompt/context hoặc gọi thẳng Claude CLI nếu máy đã cài

## Cấu trúc

- `config.json`: cấu hình RULE, output, lệnh Claude
- `prompts/`: hướng dẫn review/task check
- `bin/claude-kit`: CLI chính

## Yêu cầu

- `git`
- `python3`
- `gh`
- Tùy chọn: `claude` CLI nếu muốn dùng `--run`

## Lệnh hỗ trợ

```bash
./claude-kit/bin/claude-kit help
./claude-kit/bin/claude-kit print-rules
./claude-kit/bin/claude-kit review-pr 123
./claude-kit/bin/claude-kit review-pr 123 --stdout
./claude-kit/bin/claude-kit review-pr 123 --run
./claude-kit/bin/claude-kit check-task 456
./claude-kit/bin/claude-kit check-task --branch feature/my-work
./claude-kit/bin/claude-kit check-task 456 --run
```

## Cách hoạt động

1. Đọc danh sách file RULE từ `config.json`
2. Gom nội dung RULE vào một block duy nhất
3. Lấy metadata qua `gh pr view` hoặc `gh issue view`
4. Lấy diff qua `gh pr diff`, `git diff`, hoặc diff giữa branch hiện tại với `default_branch`
5. Render prompt hoàn chỉnh ra file trong `claude-kit/output/`
6. Ghi kết quả ra `claude-reviews/` hoặc in ra `stdout`
7. Nếu dùng `--run`, gửi prompt sang Claude CLI

## Cấu hình

`config.json` mặc định đang đọc các file:

- `CLAUDE.md`
- `frontend/CLAUDE.md`
- `frontend/AGENTS.md`

Bạn có thể sửa `rules_md` để thêm hoặc bỏ bớt tài liệu rule nội bộ.

`outputs.pr_review` và `outputs.task_check` hỗ trợ biến:

- `${PR}`
- `${TASK}`
- `${COMMAND}`
- `${ID}`

## Gợi ý workflow

### Review PR

```bash
gh auth login
./claude-kit/bin/claude-kit review-pr 42 --run
```

### Check task local trước khi mở PR

```bash
git checkout feature/my-task
./claude-kit/bin/claude-kit check-task 101 --run
```

Hoặc nếu chưa muốn gọi Claude, bỏ `--run` để chỉ render prompt và context review.
