const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../..');

class AuditJsonReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || path.resolve(__dirname, '../results.json');
    this.records = [];
  }

  onTestEnd(test, result) {
    const metaAnn = test.annotations.find((a) => a.type === 'audit-meta');
    let meta = {};
    if (metaAnn && metaAnn.description) {
      try {
        meta = JSON.parse(metaAnn.description);
      } catch (_) {}
    }

    let status = 'BLOCKED';
    if (result.status === 'passed') status = 'PASS';
    else if (result.status === 'failed' || result.status === 'timedOut') status = 'FAIL';

    const errorList = Array.isArray(result.errors) && result.errors.length > 0
      ? result.errors
      : result.error
        ? [result.error]
        : [];
    const perErrorLines = errorList.length > 1 ? 5 : 8;
    const rawError = errorList
      .map((e, idx) => {
        const cleanLines = String(e?.message || '')
          .replace(/\u001b\[[0-9;]*m/g, '')
          .split('\n')
          .map((l) => l.trimEnd())
          .filter((l) => l.trim().length > 0)
          .slice(0, perErrorLines)
          .join(' | ');
        return errorList.length > 1 ? `[#${idx + 1}] ${cleanLines}` : cleanLines;
      })
      .filter(Boolean)
      .join(' || ');

    let actualResult = '';
    if (status === 'PASS') {
      actualResult = meta.passActualResult || 'Passed: Realtime sync and data integrity verified within threshold.';
    } else if (status === 'FAIL') {
      actualResult = meta.failActualResult
        ? `${meta.failActualResult} (${rawError})`
        : rawError || 'Assertion failed';
    } else {
      actualResult = `BLOCKED (${result.status}): ${rawError}`;
    }

    const evidenceFiles = (result.attachments || [])
      .filter((a) => a.name === 'evidence-file' && a.path)
      .map((a) => {
        const p = path.isAbsolute(a.path) ? path.relative(ROOT_DIR, a.path) : a.path;
        return p.replace(/\\/g, '/');
      });

    this.records.push({
      testCaseId: meta.testCaseId || test.title,
      module: meta.module || 'General',
      scenario: meta.scenario || test.title,
      preConditions: meta.preConditions || '',
      steps: meta.steps || [],
      testData: meta.testData || {},
      expectedBehavior: meta.expectedBehavior || '',
      actualResult,
      status,
      defectId: status === 'PASS' ? null : meta.defectId || null,
      severity: meta.severity || (status === 'PASS' ? 'LOW' : 'HIGH'),
      rootCause: status === 'PASS' ? null : meta.rootCause || null,
      proposedFix: status === 'PASS' ? null : meta.proposedFix || null,
      affectedComponents: meta.affectedComponents || {},
      evidenceFiles,
      durationMs: result.duration || 0,
    });
  }

  onEnd() {
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    fs.writeFileSync(this.outputFile, JSON.stringify(this.records, null, 2), 'utf8');
  }
}

module.exports = AuditJsonReporter;
