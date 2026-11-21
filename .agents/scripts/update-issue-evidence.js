#!/usr/bin/env node

/**
 * Script cập nhật Evidence (Bằng chứng kiểm thử) cho các GitHub Issues #21 đến #31
 * Sử dụng branch media-assets để lưu trữ hình ảnh và video chuẩn hóa (không bị 404, không bị GitHub sanitizer strip).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repo = 'LCHLong/SmartRestaurant';
const mediaBranch = 'media-assets';
const rawBaseUrl = `https://raw.githubusercontent.com/${repo}/${mediaBranch}`;
const blobBaseUrl = `https://github.com/${repo}/blob/${mediaBranch}`;

const issuesConfig = {
  21: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-RES-05: Backend 500 Internal Server Error when querying available reservation slots',
    img: 'issue-21-res-05-backend-500.png',
    vid: 'issue-21-res-05-backend-500.webm'
  },
  22: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-REC-06: Khách dị ứng cá biển nặng hỏi về nước mắm và dầu hào trong món xào',
    img: 'issue-22-rec-06-allergy-fish.png',
    vid: 'issue-22-rec-06-allergy-fish.webm'
  },
  23: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-MEM-01..10: MemGPT Memory Engine Non-Functional',
    img: 'issue-23-mem-01-memgpt-offline.png',
    vid: 'issue-23-mem-01-memgpt-offline.webm'
  },
  24: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-RES-01..12: Reservation Business Rules Bypassed',
    img: 'issue-24-res-01-after-hours-booking.png',
    vid: 'issue-24-res-01-after-hours-booking.webm'
  },
  25: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-ATC-02..11, TC-REC-02..10: Chatbot Intent Classification Loop',
    img: 'issue-25-atc-02-intent-classification-loop.png',
    vid: 'issue-25-atc-02-intent-classification-loop.webm'
  },
  26: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 5\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-SEC-02, TC-SUP-10: Toxicity Moderation & Emergency Manager Escalation Bypassed',
    img: 'issue-26-sec-02-toxicity-escalation.png',
    vid: 'issue-26-sec-02-toxicity-escalation.webm'
  },
  27: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 4\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-ATC-01..05: Missing In-Chat Food Cards',
    img: 'issue-27-atc-01-missing-food-cards.png',
    vid: 'issue-27-atc-01-missing-food-cards.webm'
  },
  28: {
    headingRegex: /### 📎 Bằng Chứng.*$|### 4\.\s*Bằng chứng kiểm thử.*$/ms,
    scenario: 'TC-SUP-06..08: Call Staff Button Pointer Interception & Missing Cooldown',
    img: 'issue-28-sup-06-call-staff-button.png',
    vid: 'issue-28-sup-06-call-staff-button.webm'
  },
  29: {
    headingRegex: /### 📎 Bằng Chứng.*$|## 📎 4\.\s*Bằng Chứng Nghiệm Thu.*$/ms,
    scenario: 'TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý',
    img: 'issue-29-sup-10-complaint-escalation.png',
    vid: 'issue-29-sup-10-complaint-escalation.webm'
  },
  30: {
    headingRegex: /### 📎 Bằng Chứng.*$|## 📎 3\.\s*Bằng Chứng Thực Thi.*$/ms,
    scenario: 'Tổng hợp 27 lỗi kiểm thử hộp đen Chatbox Aria (Playwright SDV 63 Test Cases)',
    img: 'issue-30-overview-27-defects.png',
    vid: 'issue-30-overview-27-defects.webm'
  },
  31: {
    headingRegex: /### 📎 Bằng Chứng.*$|## 📎 4\.\s*Bằng Chứng Nghiệm Thu.*$/ms,
    scenario: 'TC-SUP-10: Khách bức xúc vì chờ món quá lâu, kích hoạt báo động khẩn cấp tới Quản lý',
    img: 'issue-31-sup-10-complaint-escalation.png',
    vid: 'issue-31-sup-10-complaint-escalation.webm'
  }
};

function generateEvidenceBlock(cfg) {
  const rawImgUrl = `${rawBaseUrl}/images/${cfg.img}`;
  const rawVidUrl = `${rawBaseUrl}/videos/${cfg.vid}`;
  const blobVidUrl = `${blobBaseUrl}/videos/${cfg.vid}`;

  return `### 📎 Bằng Chứng Nghiệm Thu Trực Quan (Evidence)

#### 📸 Ảnh chụp màn hình lỗi (Screenshot)
![Ảnh chụp lỗi: ${cfg.scenario}](${rawImgUrl})

<details>
<summary>🔍 Chi tiết & Đường dẫn ảnh</summary>

- **Tên tệp lưu trữ:** \`images/${cfg.img}\`
- **URL xem trực tiếp:** [Mở ảnh gốc trong tab mới](${rawImgUrl})
</details>

---

#### 🎬 Băng ghi hình Playwright (Video)
> 🎥 **Playwright E2E Video Recording:**  
> ▶️ **[Nhấn vào đây để Xem Video trực tiếp trên trình duyệt GitHub](${blobVidUrl})**  
> 📥 **[Tải file Video WebM gốc (${cfg.vid})](${rawVidUrl})**

[![Xem Video Playwright](${rawImgUrl})](${blobVidUrl})
*Tip: Bấm vào ảnh trên hoặc link để mở video trực tiếp trên trình phát của GitHub.*
`;
}

function updateIssues() {
  console.log(`[update-issue-evidence] Bắt đầu cập nhật Evidence cho các issue #21 đến #31 qua branch "${mediaBranch}"...`);

  for (const [num, cfg] of Object.entries(issuesConfig)) {
    console.log(`\n[update-issue-evidence] Đang xử lý Issue #${num}...`);
    try {
      const issueJsonStr = execSync(`gh issue view ${num} --repo ${repo} --json title,body`, { encoding: 'utf-8' });
      const { title, body } = JSON.parse(issueJsonStr);

      const match = body.match(cfg.headingRegex);
      let newBody = '';
      const evidenceBlock = generateEvidenceBlock(cfg);

      if (match && match.index !== undefined) {
        newBody = body.substring(0, match.index) + evidenceBlock;
      } else {
        newBody = body + '\n\n---\n\n' + evidenceBlock;
      }

      const tempFilePath = path.join(process.cwd(), 'test-results', `temp_issue_${num}.md`);
      fs.writeFileSync(tempFilePath, newBody, 'utf-8');

      const editCmd = `gh issue edit ${num} --repo ${repo} --body-file "${tempFilePath}"`;
      const out = execSync(editCmd, { encoding: 'utf-8' }).trim();
      console.log(`[update-issue-evidence] Issue #${num} cập nhật thành công: ${out}`);

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (err) {
      console.error(`[update-issue-evidence] Lỗi khi cập nhật Issue #${num}:`, err.message);
    }
  }

  console.log('\n[update-issue-evidence] Hoàn tất cập nhật tất cả các issue!');
}

updateIssues();
