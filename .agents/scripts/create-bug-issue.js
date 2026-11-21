#!/usr/bin/env node

/**
 * Script tự động tạo GitHub Bug Issue từ kết quả kiểm thử trong test-results/test-status.json
 * Lưu trữ hình ảnh và video trên branch media-assets để đảm bảo hiển thị 100% trên GitHub.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

function syncMediaAsset(repo, localPath, type, slug) {
  if (!localPath || !fs.existsSync(localPath)) return null;

  const mediaWorktree = '/tmp/media-assets';
  try {
    if (!fs.existsSync(mediaWorktree)) {
      execSync(`git worktree add ${mediaWorktree} origin/media-assets`, { stdio: 'pipe' });
    }
  } catch (e) {
    console.warn(`[create-bug-issue] Không thể mount worktree media-assets: ${e.message}`);
    return null;
  }

  const ext = path.extname(localPath);
  const targetDirName = type === 'video' ? 'videos' : 'images';
  const targetDir = path.join(mediaWorktree, targetDirName);
  fs.makedirsSync ? fs.makedirsSync(targetDir, { recursive: true }) : fs.mkdirSync(targetDir, { recursive: true });

  const fileName = `${slug}-${Date.now()}${ext}`;
  const targetFilePath = path.join(targetDir, fileName);
  fs.copyFileSync(localPath, targetFilePath);

  try {
    execSync(`cd ${mediaWorktree} && git add "${targetDirName}/${fileName}" && git commit -m "docs: add ${type} for ${slug}" && git push origin media-assets`, { stdio: 'pipe' });
  } catch (err) {
    console.warn(`[create-bug-issue] Cảnh báo khi push asset lên media-assets: ${err.message}`);
  }

  return {
    fileName,
    rawUrl: `https://raw.githubusercontent.com/${repo}/media-assets/${targetDirName}/${fileName}`,
    blobUrl: `https://github.com/${repo}/blob/media-assets/${targetDirName}/${fileName}`
  };
}

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
  const timestamp = statusData.timestamp || new Date().toISOString();
  const repo = 'LCHLong/SmartRestaurant';
  const slug = slugify(testName) || 'defect';

  const cleanScreenshotPath = statusData.screenshot_path ? path.resolve(cwd, statusData.screenshot_path) : null;
  const cleanVideoPath = statusData.video_path ? path.resolve(cwd, statusData.video_path) : null;

  console.log('[create-bug-issue] Đang đồng bộ bằng chứng media lên branch media-assets...');
  const imgAsset = syncMediaAsset(repo, cleanScreenshotPath, 'image', slug);
  const vidAsset = syncMediaAsset(repo, cleanVideoPath, 'video', slug);

  let evidenceSection = `## 📎 4. Bằng Chứng Nghiệm Thu / Evidence\n\n`;

  if (imgAsset) {
    evidenceSection += `### 📸 Ảnh chụp màn hình lỗi (Screenshot)\n` +
      `![Ảnh chụp lỗi: ${testName}](${imgAsset.rawUrl})\n\n` +
      `<details>\n<summary>🔍 Chi tiết & Đường dẫn ảnh</summary>\n\n` +
      `- **Tên tệp lưu trữ:** \`images/${imgAsset.fileName}\`\n` +
      `- **URL xem trực tiếp:** [Mở ảnh gốc trong tab mới](${imgAsset.rawUrl})\n` +
      `</details>\n\n---\n\n`;
  } else {
    evidenceSection += `- **Ảnh chụp màn hình (Screenshot):** Không có (N/A)\n\n`;
  }

  if (vidAsset) {
    evidenceSection += `### 🎬 Băng ghi hình Playwright (Video)\n` +
      `> 🎥 **Playwright E2E Video Recording:**  \n` +
      `> ▶️ **[Nhấn vào đây để Xem Video trực tiếp trên trình duyệt GitHub](${vidAsset.blobUrl})**  \n` +
      `> 📥 **[Tải file Video WebM gốc (${vidAsset.fileName})](${vidAsset.rawUrl})**\n\n`;

    if (imgAsset) {
      evidenceSection += `[![Xem Video Playwright](${imgAsset.rawUrl})](${vidAsset.blobUrl})\n` +
        `*Tip: Bấm vào ảnh trên hoặc link để mở video trực tiếp trên trình phát của GitHub.*\n\n`;
    }
  } else {
    evidenceSection += `- **Băng ghi hình Playwright (Video):** Không có (N/A)\n`;
  }

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

${evidenceSection}`;

  const tempBodyPath = path.join(cwd, 'test-results', 'temp_issue_body.md');
  fs.writeFileSync(tempBodyPath, body, 'utf-8');

  console.log(`[create-bug-issue] Đang tạo GitHub Bug Issue: "${title}"...`);
  try {
    const cmd = `gh issue create --repo ${repo} --title "${title}" --body-file "${tempBodyPath}" --label "bug,automated-qa"`;
    execSync(cmd, { stdio: 'inherit' });

    // Đánh dấu đã tạo issue
    statusData.issue_created = true;
    fs.writeFileSync(statusFilePath, JSON.stringify(statusData, null, 2), 'utf-8');
    if (fs.existsSync(tempBodyPath)) {
      fs.unlinkSync(tempBodyPath);
    }
    console.log('[create-bug-issue] Đã tạo GitHub Bug Issue thành công!');
  } catch (err) {
    console.error('[create-bug-issue] Lỗi khi thực thi gh issue create:', err.message);
    process.exit(1);
  }
}

main();
