const fs = require('fs');
const path = require('path');
const { test: base, expect } = require('@playwright/test');
const { getSupabaseAdmin, createCleanupRegistry } = require('../helpers/cleanup');
const { disconnectAll } = require('../helpers/socket');

const ROOT_DIR = path.resolve(__dirname, '../../..');
const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');
const TMP_VIDEO_ROOT = path.resolve(__dirname, '../.tmp-test-results/videos');

const test = base.extend({
  supabase: async ({}, use) => {
    const client = getSupabaseAdmin();
    await use(client);
  },

  cleanup: async ({ supabase }, use) => {
    const registry = createCleanupRegistry(supabase);
    try {
      await use(registry);
    } finally {
      await registry.flush();
    }
  },

  sockets: async ({}, use) => {
    const handles = [];
    try {
      await use(handles);
    } finally {
      disconnectAll(handles);
    }
  },

  audit: async ({ browser }, use, testInfo) => {
    const trackedContexts = [];
    const trackedPages = [];
    const dialogHandlers = new WeakMap();
    const tmpVideoDir = path.join(TMP_VIDEO_ROOT, `${testInfo.testId.replace(/[^a-zA-Z0-9_-]/g, '_')}`);
    fs.mkdirSync(tmpVideoDir, { recursive: true });
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

    let primaryPage = null;
    let evidenceBugId = null;
    let evidenceShortDesc = null;
    let firstContextAt = null;
    let forceEvidence = false;

    const api = {
      setMeta(meta) {
        testInfo.annotations.push({
          type: 'audit-meta',
          description: JSON.stringify(meta),
        });
      },

      setEvidencePage(page, bugId, shortDesc) {
        primaryPage = page;
        if (bugId) evidenceBugId = bugId;
        if (shortDesc) evidenceShortDesc = shortDesc;
      },

      markForceEvidence(bugId, shortDesc) {
        forceEvidence = true;
        if (bugId) evidenceBugId = bugId;
        if (shortDesc) evidenceShortDesc = shortDesc;
      },

      onDialog(page, handler) {
        dialogHandlers.set(page, handler);
      },

      async createAuditContext(label, opts = {}) {
        if (!firstContextAt) firstContextAt = Date.now();
        const context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          locale: 'en-US',
          recordVideo: {
            dir: tmpVideoDir,
            size: { width: 1280, height: 720 },
          },
          ...opts,
        });

        context.on('page', (p) => {
          trackedPages.push(p);
          p.on('dialog', async (dialog) => {
            const custom = dialogHandlers.get(p);
            if (custom) {
              await custom(dialog);
            } else {
              await dialog.accept().catch(() => {});
            }
          });
        });

        trackedContexts.push({ label, context });
        return context;
      },

      async newPage(context) {
        const page = await context.newPage();
        return page;
      },
    };

    try {
      await use(api);
    } finally {
      const shouldCapture = (testInfo.status !== 'passed' || forceEvidence) && trackedPages.length > 0;

      if (shouldCapture) {
        const targetPage = primaryPage && !primaryPage.isClosed()
          ? primaryPage
          : trackedPages.find((p) => !p.isClosed()) || trackedPages[trackedPages.length - 1];

        const metaAnn = testInfo.annotations.find((a) => a.type === 'audit-meta');
        let parsedMeta = {};
        try {
          if (metaAnn) parsedMeta = JSON.parse(metaAnn.description);
        } catch (_) {}

        const rawBugId = (evidenceBugId || parsedMeta.defectId || parsedMeta.testCaseId || 'UNKNOWN')
          .replace(/^BUG[-_]/i, '');
        const safeBugId = rawBugId.replace(/[^a-zA-Z0-9_-]/g, '-');
        const safeDesc = (evidenceShortDesc || 'Evidence').replace(/[^a-zA-Z0-9_-]/g, '');

        const pngName = `BUG_${safeBugId}_${safeDesc}.png`;
        const webmName = `BUG_${safeBugId}_${safeDesc}.webm`;
        const pngAbs = path.join(EVIDENCE_DIR, pngName);
        const webmAbs = path.join(EVIDENCE_DIR, webmName);

        let videoObj = null;
        try {
          if (targetPage && !targetPage.isClosed()) {
            const elapsed = firstContextAt ? Date.now() - firstContextAt : 6000;
            if (elapsed < 5500) {
              await targetPage.waitForTimeout(5500 - elapsed).catch(() => {});
            }
            await targetPage.screenshot({ path: pngAbs, fullPage: false });
            videoObj = targetPage.video();
          }
        } catch (err) {
          console.warn('[audit-fixture] screenshot capture failed:', err.message);
        }

        for (const entry of trackedContexts) {
          try {
            await entry.context.close();
          } catch (_) {}
        }

        if (videoObj) {
          try {
            await videoObj.saveAs(webmAbs);
          } catch (err) {
            console.warn('[audit-fixture] video saveAs failed:', err.message);
          }
        }

        if (fs.existsSync(pngAbs)) {
          testInfo.attachments.push({
            name: 'evidence-file',
            contentType: 'image/png',
            path: path.relative(ROOT_DIR, pngAbs),
          });
        }
        if (fs.existsSync(webmAbs)) {
          testInfo.attachments.push({
            name: 'evidence-file',
            contentType: 'video/webm',
            path: path.relative(ROOT_DIR, webmAbs),
          });
        }
      } else {
        for (const entry of trackedContexts) {
          try {
            await entry.context.close();
          } catch (_) {}
        }
      }

      try {
        fs.rmSync(tmpVideoDir, { recursive: true, force: true });
      } catch (_) {}
    }
  },
});

module.exports = {
  test,
  expect,
};
