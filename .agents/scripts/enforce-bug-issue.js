#!/usr/bin/env node

/**
 * Stop Hook: Chốt chặn kiểm soát tối cao
 * 1. Ép Agent BẮT BUỘC phải sinh code test Playwright (.spec.js) khi thực hiện Master Task Directive
 * 2. Ép Agent BẮT BUỘC phải tạo GitHub Bug Issue nếu có lỗi kiểm thử
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
    const execNum = payload.executionNum || 0;
    const lastUserInput = (payload.lastUserInput || '').toLowerCase();

    // Tránh loop vô tận nếu đã nhắc nhở quá 3 lần
    if (execNum >= 3) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    // Kiểm tra xem đây có phải là phiên thực thi Master Task Directive / QA Runner không
    const isQADirectiveSession = 
      lastUserInput.includes('master task directive') ||
      lastUserInput.includes('autonomous black-box qa') ||
      lastUserInput.includes('test:blackbox') ||
      fs.existsSync(path.join(cwd, '.agents', 'ENFORCE_QA_ACTIVE'));

    // ─────────────────────────────────────────────────────────────────────────────
    // CHỐT CHẶN 1: BẮT BUỘC PHẢI SINH MÃ TEST TRONG tests/blackbox/ (KHI Ở PHIÊN QA)
    // ─────────────────────────────────────────────────────────────────────────────
    if (isQADirectiveSession) {
      const blackboxDir = path.join(cwd, 'tests', 'blackbox');
      if (fs.existsSync(blackboxDir)) {
        const specFiles = fs.readdirSync(blackboxDir).filter(f => f.endsWith('.spec.js'));
        
        // Nếu chỉ có duy nhất app.spec.js hoặc không có file nào mới
        const hasOnlyAppSpec = specFiles.length <= 1 && specFiles.includes('app.spec.js');
        const hasNoNewSpecs = specFiles.length === 0;

        if (hasOnlyAppSpec || hasNoNewSpecs) {
          process.stdout.write(JSON.stringify({
            decision: "continue",
            reason: `[CHỐT CHẶN CƯỠNG CHẾ BẰNG CODE - THIẾU MÃ TEST]
LỖI NGHIÊM TRỌNG: Bạn CHƯA tạo bất kỳ file kịch bản Playwright (.spec.js) nào cho 63 kịch bản đặc tả!
Hiện tại thư mục tests/blackbox/ chỉ có: [${specFiles.join(', ')}].

BẠN BỊ CẤM DỪNG LẠI ĐỂ HỎI XIN PHÉP HOẶC BÁO CÁO SUÔNG.
Nhiệm vụ bắt buộc ngay bây giờ:
1. Đọc các file spec tại test/specs/modules/
2. Dùng công cụ write_file để tạo các file kịch bản Playwright vào tests/blackbox/ (ví dụ: 01_recommendations.spec.js, 02_in_chat_cart.spec.js, ...)
3. Chạy lệnh: npm run test:blackbox`
          }));
          return;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // CHỐT CHẶN 2: BẮT BUỘC TẠO GITHUB BUG ISSUE NẾU CÓ LỖI KIỂM THỬ
    // ─────────────────────────────────────────────────────────────────────────────
    const statusFilePath = path.join(cwd, 'test-results', 'test-status.json');
    if (fs.existsSync(statusFilePath)) {
      let testStatus = {};
      try {
        testStatus = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
      } catch (e) {}

      if (testStatus.has_error && !testStatus.issue_created) {
        // Kiểm tra transcript xem Agent đã gọi lệnh tạo issue chưa
        let issueCreated = false;
        if (transcriptPath && fs.existsSync(transcriptPath)) {
          try {
            const transcriptContent = fs.readFileSync(transcriptPath, 'utf-8');
            if (transcriptContent.includes('gh-axi issue create') || transcriptContent.includes('issue create')) {
              issueCreated = true;
            }
          } catch (e) {}
        }

        if (issueCreated) {
          testStatus.issue_created = true;
          try {
            fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
          } catch (e) {}
          process.stdout.write(JSON.stringify({ decision: "allow" }));
          return;
        }

        // Chưa tạo issue -> Chặn đứng!
        process.stdout.write(JSON.stringify({
          decision: "continue",
          reason: `[CHỐT CHẶN CƯỠNG CHẾ BẰNG CODE - THIẾU BUG ISSUE]
Phát hiện lỗi kiểm thử trong file test-results/test-status.json:
- Kịch bản lỗi: "${testStatus.test_name || 'Kiểm thử hộp đen'}"
- Chi tiết: "${testStatus.error_message || 'Assertion failed'}"
- Bằng chứng video: "${testStatus.video_path || 'test-results/recordings/'}"
- Bằng chứng ảnh: "${testStatus.screenshot_path || 'test-results/screenshots/'}"

Bạn BẮT BUỘC phải tạo GitHub Bug Issue bằng lệnh \`npx -y gh-axi issue create\` trước khi được phép kết thúc lượt làm việc!`
        }));
        return;
      }
    }

    // Nếu không vi phạm gì -> Cho phép dừng
    process.stdout.write(JSON.stringify({ decision: "allow" }));

  } catch (err) {
    process.stdout.write(JSON.stringify({ decision: "allow" }));
  }
}

main();
