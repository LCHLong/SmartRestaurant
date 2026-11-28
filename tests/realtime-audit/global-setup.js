const fs = require('fs');
const path = require('path');
const { getSupabaseAdmin } = require('./helpers/cleanup');
const { CREDENTIALS } = require('./helpers/auth');

const ROOT_DIR = path.resolve(__dirname, '../..');
const bcrypt = require(path.join(ROOT_DIR, 'backend', 'node_modules', 'bcryptjs'));
const jwt = require(path.join(ROOT_DIR, 'backend', 'node_modules', 'jsonwebtoken'));

module.exports = async function globalSetup() {
  const evidenceDir = path.resolve(__dirname, 'evidence');
  const tmpDir = path.resolve(__dirname, '.tmp-test-results');

  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const supabase = getSupabaseAdmin();
  const { email, password } = CREDENTIALS.tempAdmin;
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        role: 'admin',
        full_name: 'Audit Temp Admin',
        is_verified: true,
        verification_token: null,
      })
      .eq('id', existing.id);
    if (error) throw new Error(`globalSetup failed to update tempAdmin: ${error.message}`);
  } else {
    const { error } = await supabase.from('users').insert([
      {
        email,
        password_hash: passwordHash,
        full_name: 'Audit Temp Admin',
        role: 'admin',
        is_verified: true,
        phone: '0900000999',
      },
    ]);
    if (error) throw new Error(`globalSetup failed to insert tempAdmin: ${error.message}`);
  }

  // Refresh expired QR JWT tokens on active tables (snapshot originals to restore in globalTeardown)
  const secret = process.env.JWT_SECRET || 'your-default-secret';
  const { data: tables } = await supabase
    .from('tables')
    .select('id, table_number, qr_code_token')
    .eq('is_active', true);

  const backup = [];
  for (const tbl of tables || []) {
    let needsRefresh = false;
    try {
      jwt.verify(tbl.qr_code_token, secret);
    } catch (_) {
      needsRefresh = true;
    }
    if (needsRefresh) {
      backup.push({ id: tbl.id, qr_code_token: tbl.qr_code_token });
      const freshToken = jwt.sign(
        { table_id: tbl.id, restaurant_id: 'default_res', iat: Math.floor(Date.now() / 1000) },
        secret,
        { expiresIn: '90d' }
      );
      await supabase.from('tables').update({ qr_code_token: freshToken }).eq('id', tbl.id);
    }
  }
  fs.writeFileSync(path.join(tmpDir, 'qr_backup.json'), JSON.stringify(backup), 'utf8');
};
