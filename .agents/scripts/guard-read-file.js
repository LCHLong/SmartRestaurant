#!/usr/bin/env node

/**
 * PreToolUse Hook: Chặn cứng Agent đọc mã nguồn
 */
const fs = require('fs');

function main() {
  try {
    const input = fs.readFileSync(0, 'utf-8');
    if (!input || !input.trim()) {
      process.stdout.write(JSON.stringify({ decision: "allow" }));
      return;
    }

    const payload = JSON.parse(input);
    const toolCall = payload.toolCall;

    if (toolCall && toolCall.name === 'read_file') {
      const filePath = toolCall.args?.Path || '';
      const blockedPatterns = [
        '/frontend/src/',
        '/backend/',
        '/ai-service/',
        '/database/'
      ];

      const isBlocked = blockedPatterns.some(pattern => filePath.includes(pattern));
      if (isBlocked) {
        process.stdout.write(JSON.stringify({
          decision: "deny",
          reason: `[CHỐT CHẶN BẢO VỆ] Thao tác đọc file "${filePath}" bị CẤM TUYỆT ĐỐI. Bạn là Black-box QA Agent, không được phép đọc mã nguồn!`
        }));
        return;
      }
    }

    process.stdout.write(JSON.stringify({ decision: "allow" }));
  } catch (err) {
    // Fallback an toàn
    process.stdout.write(JSON.stringify({ decision: "allow" }));
  }
}

main();
