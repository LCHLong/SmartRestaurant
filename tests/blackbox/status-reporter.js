// tests/blackbox/status-reporter.js
const fs = require('fs');
const path = require('path');

class StatusReporter {
  constructor() {
    this.failures = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  onBegin(config, suite) {
    this.failures = [];
    this.totalTests = 0;
    this.passedTests = 0;
    const resultsDir = path.resolve(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  }

  onTestEnd(test, result) {
    const resultsDir = path.resolve(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const statusFilePath = path.join(resultsDir, 'test-status.json');
    this.totalTests++;

    if (result.status === 'failed' || result.status === 'timedOut') {
      const videoAttachment = result.attachments.find(a => a.name === 'video');
      const screenshotAttachment = result.attachments.find(a => a.name === 'screenshot');

      const failureItem = {
        test_name: test.title,
        status: result.status,
        duration: result.duration,
        error_message: result.error?.message || 'Unknown test error',
        video_path: videoAttachment ? path.relative(process.cwd(), videoAttachment.path) : null,
        screenshot_path: screenshotAttachment ? path.relative(process.cwd(), screenshotAttachment.path) : null,
        timestamp: new Date().toISOString()
      };

      this.failures.push(failureItem);

      const testStatus = {
        has_error: true,
        test_name: test.title,
        status: result.status,
        duration: result.duration,
        error_message: result.error?.message || 'Unknown test error',
        video_path: failureItem.video_path,
        screenshot_path: failureItem.screenshot_path,
        timestamp: new Date().toISOString(),
        issue_created: false,
        total_failures: this.failures.length,
        failures: this.failures
      };

      fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
      console.log(`\n[StatusReporter] Ghi nhận lỗi kiểm thử (${this.failures.length} lỗi): ${test.title}`);
    } else {
      this.passedTests++;
      // Only set has_error = false if there are NO failures accumulated
      if (this.failures.length === 0) {
        const testStatus = {
          has_error: false,
          test_name: test.title,
          status: result.status,
          timestamp: new Date().toISOString(),
          passed_count: this.passedTests
        };
        fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
      }
    }
  }

  onEnd(result) {
    const resultsDir = path.resolve(process.cwd(), 'test-results');
    const summaryFilePath = path.join(resultsDir, 'test-summary.json');
    const statusFilePath = path.join(resultsDir, 'test-status.json');
    const summary = {
      status: result.status,
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failures.length,
      failures: this.failures,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));

    if (this.failures.length > 0) {
      const lastFail = this.failures[this.failures.length - 1];
      const testStatus = {
        has_error: true,
        test_name: lastFail.test_name,
        status: lastFail.status,
        duration: lastFail.duration,
        error_message: lastFail.error_message,
        video_path: lastFail.video_path,
        screenshot_path: lastFail.screenshot_path,
        timestamp: new Date().toISOString(),
        issue_created: false,
        total_failures: this.failures.length,
        failures: this.failures
      };
      fs.writeFileSync(statusFilePath, JSON.stringify(testStatus, null, 2));
    }

    console.log(`\n[StatusReporter] Tổng kết kiểm thử: Tổng ${this.totalTests} | Đạt: ${this.passedTests} | Lỗi: ${this.failures.length}`);
  }
}

module.exports = StatusReporter;
