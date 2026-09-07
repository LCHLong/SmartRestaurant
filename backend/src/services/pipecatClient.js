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
  const serviceUrl = new URL('/chat', PIPECAT_URL);
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

      // Parse SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // giữ phần chưa đủ dòng

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;

        try {
          const event = JSON.parse(raw);

          if (event.type === 'token' && event.content) {
            finalResult.text += event.content;
            onToken(event.content);
          } else if (event.type === 'done') {
            finalResult.suggestedItems = event.suggestedItems || [];
          } else if (event.type === 'error') {
            onError(new Error(event.message || 'Pipecat pipeline error'));
          }
        } catch (_) {
          // Bỏ qua dòng không parse được
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
    const healthUrl = new URL('/health', PIPECAT_URL);
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

module.exports = { streamFromPipecat, callPipecat, isPipecatHealthy };
