#!/usr/bin/env node

/**
 * Script tự động tạo GitHub Bug Issue từ kết quả kiểm thử trong test-results/test-status.json
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  const cwd = process.cwd();
  const statusFilePath = path.join(cwd, 'test-results', 'test-status.json');

  if (!fs.existsSync(statusFilePath)) {
    console.log('[create-bug-issue] Không tìm thấy file test-results/test-status.json.');
    process.exit(0);
  }

  let statusData = {};
  try {
    statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
  } catch (err) {
    console.error('[create-bug-issue] Lỗi khi đọc file test-status.json:', err.message);
    process.exit(1);
  }

  if (!statusData.has_error) {
    console.log('[create-bug-issue] Kiểm thử thành công, không có lỗi cần tạo issue.');
    process.exit(0);
  }

  if (statusData.issue_created) {
    console.log('[create-bug-issue] Issue đã được tạo trước đó cho kịch bản này.');
    process.exit(0);
  }

  const testName = statusData.test_name || 'Kiểm thử hộp đen không xác định';
  const errorMessage = statusData.error_message || 'Assertion failed / Timeout';
  const screenshotPath = statusData.screenshot_path ? `test-results/${path.basename(statusData.screenshot_path)}` : 'N/A';
  const videoPath = statusData.video_path ? `test-results/${path.basename(statusData.video_path)}` : 'N/A';
  const timestamp = statusData.timestamp || new Date().toISOString();

  const title = `[BUG] [AUTO-QA]: ${testName}`;
  const body = `## 📌 1. Thông Tin Chung / Overview
- **Dự án / Project:** SmartRestaurant
- **Kịch bản kiểm thử / Test Scenario:** ${testName}
- **Thời gian / Timestamp:** ${timestamp}
- **Nguồn phát hiện:** Black-box QA Automation

---

## 📝 2. Mô Tả Chi Tiết / Detailed Description
Phát hiện lỗi trong quá trình thực thi kịch bản kiểm thử hộp đen tự động:
\`\`\`text
${errorMessage}
\`\`\`

---

## 🎯 3. Kết Quả Thực Tế vs Kỳ Vọng / Actual vs Expected
- **Thực tế (Actual):** Bài test bị thất bại do assertion vi phạm hoặc phần tử không xuất hiện đúng kỳ vọng.
- **Kỳ vọng (Expected):** Giao diện và API phải tuân thủ đúng đặc tả tại \`test/specs/spec.md\`.

---

## 📎 4. Bằng Chứng Nghiệm Thu / Evidence
- **Ảnh chụp màn hình (Screenshot):** \`${screenshotPath}\`
- **Băng ghi hình Playwright (Video):** \`${videoPath}\`
`;

  const tempBodyPath = path.join(cwd, 'test-results', 'temp_issue_body.md');
  fs.writeFileSync(tempBodyPath, body, 'utf-8');

  console.log(`[create-bug-issue] Đang tạo GitHub Bug Issue: "${title}"...`);
  try {
    const cmd = `npx -y gh-axi issue create --title "${title}" --body-file "${tempBodyPath}" --label "bug,automated-qa"`;
    const result = execSync(cmd, { stdio: 'inherit' });

    // Đánh dấu đã tạo issue
    statusData.issue_created = true;
    fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2), 'utf-8');
    if (fs.existsSync(tempBodyPath)) {
      fs.unlinkSync(tempBodyPath);
    }
    console.log('[create-bug-issue] Đã tạo GitHub Bug Issue thành công!');
  } catch (err) {
    console.error('[create-bug-issue] Lỗi khi thực thi gh-axi issue create:', err.message);
    process.exit(1);
  }
}

main();
