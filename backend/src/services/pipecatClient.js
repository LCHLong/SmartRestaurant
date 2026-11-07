/**
 * pipecatClient.js
 * HTTP client để gọi Pipecat Python microservice từ Node.js Gateway
 *
 * Pipecat Service chạy tại PIPECAT_SERVICE_URL (default: http://localhost:8000)
 * Node.js nhận stream SSE / WebSocket tokens từ Pipecat rồi emit qua Socket.io
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PIPECAT_URL = process.env.PIPECAT_SERVICE_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 30000; // 30 giây timeout

function getPipecatEndpoint(path) {
  const base = PIPECAT_URL.endsWith('/') ? PIPECAT_URL : `${PIPECAT_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(cleanPath, base);
}

/**
 * Gọi Pipecat /chat endpoint — nhận stream SSE (Server-Sent Events)
 * Pipecat sẽ stream từng token text về qua SSE, Node.js đọc và emit Socket.io
 *
 * @param {Object} payload   - { message, context, cartItems, sessionId, history, fallbackUsed }
 * @param {Function} onToken - callback(token: string) — gọi mỗi khi có token mới
 * @param {Function} onDone  - callback(result: Object) — gọi khi stream hoàn thành
 * @param {Function} onError - callback(err: Error)
 */
function streamFromPipecat(payload, onToken, onDone, onError) {
  const serviceUrl = getPipecatEndpoint('chat');
  const body = JSON.stringify(payload);

  const options = {
    hostname: serviceUrl.hostname,
    port: serviceUrl.port || (serviceUrl.protocol === 'https:' ? 443 : 80),
    path: serviceUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Accept': 'text/event-stream'
    },
    timeout: REQUEST_TIMEOUT_MS
  };

  const transport = serviceUrl.protocol === 'https:' ? https : http;

  const req = transport.request(options, (res) => {
    if (res.statusCode !== 200) {
      const err = new Error(`Pipecat returned ${res.statusCode}`);
      return onError(err);
    }

    let buffer = '';
    let finalResult = { text: '', suggestedItems: [] };

    res.on('data', (chunk) => {
      buffer += chunk.toString();

      // SSE chuẩn W3C dùng \n\n để kết thúc mỗi event (không phải \n đơn)
      // Split theo \n\n để tránh mất token khi TCP buffer bị cắt giữa chừng
      const events = buffer.split('\n\n');
      buffer = events.pop(); // giữ event chưa hoàn chỉnh (không có \n\n cuối)

      for (const event of events) {
        // Lấy dòng data: trong event (bỏ qua dòng id:, event:, comment:)
        const dataLine = event.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;

        const raw = dataLine.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;

        try {
          const parsedEvent = JSON.parse(raw);

          if (parsedEvent.type === 'token' && parsedEvent.content) {
            finalResult.text += parsedEvent.content;
            onToken(parsedEvent.content);
          } else if (parsedEvent.type === 'done') {
            finalResult.suggestedItems = parsedEvent.suggestedItems || [];
            if (parsedEvent.reservation) {
              finalResult.reservation = parsedEvent.reservation;
            }
            if (parsedEvent.isHandoff) {
              finalResult.isHandoff = true;
              finalResult.handoffPayload = parsedEvent.handoffPayload || null;
            }
          } else if (parsedEvent.type === 'error') {
            onError(new Error(parsedEvent.message || 'Pipecat pipeline error'));
          }
        } catch (_) {
          // Bỏ qua event không parse được (vd: heartbeat, comment)
        }
      }
    });

    res.on('end', () => {
      onDone(finalResult);
    });

    res.on('error', onError);
  });

  req.on('timeout', () => {
    req.destroy();
    onError(new Error('Pipecat request timeout'));
  });

  req.on('error', onError);
  req.write(body);
  req.end();
}

/**
 * Promise wrapper cho streamFromPipecat — dùng khi không cần streaming intermediate
 * (chờ toàn bộ response rồi trả về)
 */
function callPipecat(payload) {
  return new Promise((resolve, reject) => {
    const tokens = [];
    streamFromPipecat(
      payload,
      (token) => tokens.push(token),
      (result) => resolve({ ...result, text: tokens.join('') || result.text }),
      reject
    );
  });
}

/**
 * Health check Pipecat service
 * @returns {Promise<boolean>}
 */
async function isPipecatHealthy() {
  return new Promise((resolve) => {
    const healthUrl = getPipecatEndpoint('health');
    const transport = healthUrl.protocol === 'https:' ? https : http;

    const req = transport.get(healthUrl.toString(), (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Gọi AI Microservice để tóm tắt hội thoại phiên làm việc (Session Summarizer)
 * POST /api/memory/summarize-session
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.userId
 * @param {Array}  params.conversationHistory
 * @param {Object} params.currentProfile
 * @returns {Promise<Object>}
 */
async function summarizeSessionWithAI({ sessionId, userId, conversationHistory, currentProfile }) {
  return new Promise((resolve, reject) => {
    const serviceUrl = getPipecatEndpoint('api/memory/summarize-session');
    const body = JSON.stringify({
      sessionId,
      userId,
      conversationHistory: (conversationHistory || []).map(h => ({
        role: h.role || 'user',
        content: h.content || ''
      })),
      currentProfile: currentProfile || null
    });

    const options = {
      hostname: serviceUrl.hostname,
      port: serviceUrl.port || (serviceUrl.protocol === 'https:' ? 443 : 80),
      path: serviceUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    };

    const transport = serviceUrl.protocol === 'https:' ? https : http;
    const req = transport.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed.data || parsed);
          } catch (e) {
            reject(new Error(`Failed to parse AI summary response: ${e.message}`));
          }
        } else {
          reject(new Error(`AI Summarizer returned status ${res.statusCode}: ${raw}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI Summarizer request timeout'));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = {
  streamFromPipecat,
  callPipecat,
  isPipecatHealthy,
  summarizeSessionWithAI
};
