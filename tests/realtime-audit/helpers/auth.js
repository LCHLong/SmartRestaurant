const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const ENV_PATH = path.join(ROOT_DIR, 'backend', '.env');
require(path.join(ROOT_DIR, 'backend', 'node_modules', 'dotenv')).config({ path: ENV_PATH });

const API_BASE = process.env.AUDIT_API_URL || 'http://localhost:5001';
const SOCKET_URL = process.env.AUDIT_SOCKET_URL || 'http://localhost:5001';
const FRONTEND_URL = process.env.AUDIT_FRONTEND_URL || 'http://localhost:5173';

const CREDENTIALS = {
  waiter: {
    email: 'waiter02@restaurant.com',
    password: 'admin123',
    expectedRole: 'waiter',
  },
  kitchen: {
    email: 'chef02@restaurant.com',
    password: 'admin123',
    expectedRole: 'kitchen',
  },
  superAdmin: {
    email: 'admin@restaurant.com',
    password: 'admin123',
    expectedRole: 'super_admin',
  },
  tempAdmin: {
    email: 'audit_admin_temp@restaurant.com',
    password: 'admin123',
    expectedRole: 'admin',
  },
};

const loginCache = new Map();

async function loginAs(request, roleKey, { useCache = true } = {}) {
  const creds = CREDENTIALS[roleKey];
  if (!creds) {
    throw new Error(`Unknown roleKey "${roleKey}". Valid keys: ${Object.keys(CREDENTIALS).join(', ')}`);
  }
  if (useCache && loginCache.has(roleKey)) {
    return loginCache.get(roleKey);
  }

  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });
  const body = await res.json();
  if (res.status() !== 200 || !body.success || !body.token) {
    throw new Error(
      `Login failed for ${roleKey} (${creds.email}): status=${res.status()} body=${JSON.stringify(body)}`
    );
  }
  const result = { token: body.token, user: body.user };
  if (useCache) {
    loginCache.set(roleKey, result);
  }
  return result;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function internalHeaders() {
  const secret = process.env.INTERNAL_SERVICE_SECRET || 'aria-ai-internal-service-secret';
  return { 'x-internal-secret': secret };
}

async function seedBrowserAuth(context, authData, { lang = 'en' } = {}) {
  await context.addInitScript(({ token, user, lang }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (lang) {
      localStorage.setItem('i18nextLng', lang);
    }
  }, { token: authData.token, user: authData.user, lang });
}

async function loginViaUI(page, roleKey, { reloadAfterLogin = true } = {}) {
  const creds = CREDENTIALS[roleKey];
  if (!creds) throw new Error(`Unknown roleKey: ${roleKey}`);

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10_000 });
  if (reloadAfterLogin) {
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
}

module.exports = {
  API_BASE,
  SOCKET_URL,
  FRONTEND_URL,
  CREDENTIALS,
  loginAs,
  authHeaders,
  internalHeaders,
  seedBrowserAuth,
  loginViaUI,
  clearLoginCache: () => loginCache.clear(),
};
