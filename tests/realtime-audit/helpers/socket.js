const path = require('path');
const { SOCKET_URL } = require('./auth');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const { io } = require(path.join(ROOT_DIR, 'frontend', 'node_modules', 'socket.io-client'));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectSocket({ token = null, rooms = [], timeoutMs = 4000, registry = null } = {}) {
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: false,
    auth: token ? { token } : {},
  });

  const events = [];
  const errors = [];

  socket.onAny((eventName, payload) => {
    const entry = { eventName, payload, ts: Date.now() };
    if (eventName === 'error') {
      errors.push(entry);
    } else {
      events.push(entry);
    }
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Socket connect timeout (${timeoutMs}ms) to ${SOCKET_URL}`));
    }, timeoutMs);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Socket connect_error: ${err.message}`));
    });
  });

  for (const room of rooms) {
    socket.emit('join_room', room);
  }
  if (rooms.length > 0) {
    await sleep(150);
  }

  const handle = {
    socket,
    rooms,
    events,
    errors,
    clearBuffers() {
      events.length = 0;
      errors.length = 0;
    },
    waitForEvent(eventName, predicate = () => true, waitMs = 1500) {
      const existing = events.find((e) => e.eventName === eventName && predicate(e.payload));
      if (existing) {
        return Promise.resolve(existing.payload);
      }

      return new Promise((resolve, reject) => {
        let settled = false;
        const onEvent = (payload) => {
          if (settled) return;
          try {
            if (predicate(payload)) {
              settled = true;
              clearTimeout(timer);
              socket.off(eventName, onEvent);
              resolve(payload);
            }
          } catch (err) {
            settled = true;
            clearTimeout(timer);
            socket.off(eventName, onEvent);
            reject(err);
          }
        };

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          socket.off(eventName, onEvent);
          reject(
            new Error(
              `Timeout (${waitMs}ms) waiting for socket event "${eventName}" in rooms [${rooms.join(', ')}]. Captured events: ${JSON.stringify(
                events.map((e) => ({ event: e.eventName, payload: e.payload }))
              )}`
            )
          );
        }, waitMs);

        socket.on(eventName, onEvent);
      });
    },
    async assertNoEvent(eventName, predicate = () => true, windowMs = 600) {
      const existing = events.find((e) => e.eventName === eventName && predicate(e.payload));
      if (existing) {
        throw new Error(
          `Expected NO "${eventName}" event in rooms [${rooms.join(', ')}], but already captured: ${JSON.stringify(existing.payload)}`
        );
      }

      await new Promise((resolve, reject) => {
        let settled = false;
        const onEvent = (payload) => {
          if (settled) return;
          if (predicate(payload)) {
            settled = true;
            clearTimeout(timer);
            socket.off(eventName, onEvent);
            reject(
              new Error(
                `Unexpected socket event "${eventName}" received in rooms [${rooms.join(', ')}]: ${JSON.stringify(payload)}`
              )
            );
          }
        };

        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          socket.off(eventName, onEvent);
          resolve();
        }, windowMs);

        socket.on(eventName, onEvent);
      });
    },
    disconnect() {
      if (socket.connected || socket.active) {
        socket.disconnect();
      }
    },
  };

  if (Array.isArray(registry)) {
    registry.push(handle);
  }
  return handle;
}

function disconnectAll(handles) {
  if (!Array.isArray(handles)) return;
  for (const h of handles) {
    try {
      h.disconnect();
    } catch (_) {}
  }
  handles.length = 0;
}

module.exports = {
  connectSocket,
  disconnectAll,
  sleep,
};
