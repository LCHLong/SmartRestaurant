const fs = require('fs');
const path = require('path');
const { getSupabaseAdmin } = require('./helpers/cleanup');
const { CREDENTIALS } = require('./helpers/auth');

module.exports = async function globalTeardown() {
  const tmpDir = path.resolve(__dirname, '.tmp-test-results');
  const qrBackupPath = path.join(tmpDir, 'qr_backup.json');

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('users').delete().eq('email', CREDENTIALS.tempAdmin.email);

    if (fs.existsSync(qrBackupPath)) {
      const backup = JSON.parse(fs.readFileSync(qrBackupPath, 'utf8'));
      for (const entry of backup) {
        await supabase
          .from('tables')
          .update({ qr_code_token: entry.qr_code_token })
          .eq('id', entry.id);
      }
    }
  } catch (err) {
    console.warn('[globalTeardown] cleanup warning:', err.message);
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
};
