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

    const testIdMatch = test.title.match(/TC-[A-Z0-9]+-\d+/i);
    const testId = testIdMatch ? testIdMatch[0].toLowerCase() : null;

    if (result.status === 'failed' || result.status === 'timedOut') {
      const videoAttachment = result.attachments.find(a => a.name === 'video');
      const screenshotAttachment = result.attachments.find(a => a.name === 'screenshot');

      let screenshotPath = screenshotAttachment ? path.relative(process.cwd(), screenshotAttachment.path) : null;
      // Fallback to step screenshot if Playwright failure screenshot not attached
      if (!screenshotPath && testId) {
        const screenshotsDir = path.resolve(process.cwd(), 'test-results/screenshots');
        if (fs.existsSync(screenshotsDir)) {
          const files = fs.readdirSync(screenshotsDir);
          const matched = files.find(f => f.toLowerCase().startsWith(testId));
          if (matched) {
            screenshotPath = path.join('test-results/screenshots', matched);
          }
        }
      }

      const failureItem = {
        test_name: test.title,
        status: result.status,
        duration: result.duration,
        error_message: result.error?.message || 'Unknown test error',
        video_path: videoAttachment ? path.relative(process.cwd(), videoAttachment.path) : null,
        screenshot_path: screenshotPath,
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
      // Purge step screenshots taken during this passed test
      if (testId) {
        const screenshotsDir = path.resolve(process.cwd(), 'test-results/screenshots');
        if (fs.existsSync(screenshotsDir)) {
          const files = fs.readdirSync(screenshotsDir);
          for (const file of files) {
            if (file.toLowerCase().startsWith(testId)) {
              try {
                fs.unlinkSync(path.join(screenshotsDir, file));
              } catch (e) {}
            }
          }
        }
      }

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

    // Final audit: ensure NO step screenshots of passed tests remain
    const failedIds = new Set(
      this.failures.map(f => {
        const m = f.test_name.match(/TC-[A-Z0-9]+-\d+/i);
        return m ? m[0].toLowerCase() : null;
      }).filter(Boolean)
    );

    const screenshotsDir = path.resolve(process.cwd(), 'test-results/screenshots');
    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir);
      for (const file of files) {
        const fileMatch = file.match(/tc-[a-z0-9]+-\d+/i);
        const fileId = fileMatch ? fileMatch[0].toLowerCase() : null;
        if (!fileId || !failedIds.has(fileId)) {
          try {
            fs.unlinkSync(path.join(screenshotsDir, file));
          } catch (e) {}
        }
      }
      if (fs.readdirSync(screenshotsDir).length === 0) {
        try {
          fs.rmdirSync(screenshotsDir);
        } catch (e) {}
      }
    }
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
