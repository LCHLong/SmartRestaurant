// tests/blackbox/status-reporter.js
const fs = require('fs');
const path = require('path');

class StatusReporter {
  onTestEnd(test, result) {
    const resultsDir = path.resolve(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const statusFilePath = path.join(resultsDir, 'test-status.json');

    if (result.status === 'failed' || result.status === 'timedOut') {
      const videoAttachment = result.attachments.find(a => a.name === 'video');
      const screenshotAttachment = result.attachments.find(a => a.name === 'screenshot');

      const testStatus = {
        has_error: true,
        test_name: test.title,
        status: result.status,
        duration: result.duration,
        error_message: result.error?.message || 'Unknown test error',
        video_path: videoAttachment ? path.relative(process.cwd(), videoAttachment.path) : null,
        screenshot_path: screenshotAttachment ? path.relative(process.cwd(), screenshotAttachment.path) : null,
        timestamp: new Date().toISOString(),
        issue_created: false
      };

      fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
      console.log(`\n[StatusReporter] Đã ghi nhận lỗi kiểm thử vào: ${statusFilePath}`);
    } else {
      // Nếu test pass thành công, xóa hoặc reset cờ lỗi cũ
      const testStatus = {
        has_error: false,
        test_name: test.title,
        status: result.status,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
    }
  }
}

module.exports = StatusReporter;
