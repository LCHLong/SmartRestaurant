#!/usr/bin/env node

/**
 * Stop Hook: Cưỡng chế Agent phải tạo GitHub Bug Issue nếu có lỗi kiểm thử
 */
const fs = require('fs');
const path = require('path');

function main() {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    if (!input || !input.trim()) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    const payload = JSON.parse(input);
    const cwd = payload.cwd || process.cwd();
    const transcriptPath = payload.transcriptPath;

    // 1. Kiểm tra file trạng thái test
    const statusFilePath = path.join(cwd, 'test-results', 'test-status.json');
    if (!fs.existsSync(statusFilePath)) {
      // Không có lỗi test nào được ghi nhận
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    let testStatus = {};
    try {
      testStatus = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
    } catch (e) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    // Nếu test thành công hoặc không có cờ lỗi, hoặc issue đã được tạo trước đó
    if (!testStatus.has_error || testStatus.issue_created) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    // 2. Kiểm tra xem trong transcript Agent đã gọi lệnh tạo issue chưa
    let issueCreated = false;
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      try {
        const transcriptContent = fs.readFileSync(transcriptPath, 'utf-8');
        // Tìm xem có lệnh gh-axi issue create hoặc issue create được gọi không
        if (transcriptContent.includes('gh-axi issue create') || transcriptContent.includes('issue create')) {
          issueCreated = true;
        }
      } catch (e) {}
    }

    if (issueCreated) {
      // Đánh dấu đã tạo issue để không kiểm tra lại
      testStatus.issue_created = true;
      try {
        fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
      } catch (e) {}

      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    // 3. Nếu có lỗi mà CHƯA tạo issue -> CƯỠNG CHẾ KHÔNG CHO PHÉP DỪNG!
    // Tránh loop vô tận nếu đã nhắc quá 2 lần
    const execNum = payload.executionNum || 0;
    if (execNum >= 3) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    process.stdout.write(JSON.stringify({
      decision: "continue",
      reason: `[CHỐT CHẶN CƯỠNG CHẾ BẰNG CODE]
Phát hiện lỗi kiểm thử trong file test-results/test-status.json:
- Kịch bản lỗi: "${testStatus.test_name || 'Kiểm thử hộp đen'}"
- Chi tiết: "${testStatus.error_message || 'Assertion failed'}"
- Bằng chứng video: "${testStatus.video_path || 'test-results/recordings/'}"
- Bằng chứng ảnh: "${testStatus.screenshot_path || 'test-results/screenshots/'}"

Bạn BẮT BUỘC phải tạo GitHub Bug Issue bằng lệnh \`npx -y gh-axi issue create\` trước khi được phép kết thúc lượt làm việc!`
    }));

  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: "allow" }));
  }
}

main();
