const db = require('../config/db');

async function findByUsername(username) {
  const [rows] = await db.execute('SELECT * FROM sys_user WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id, username, nickname, status, failed_login_count, locked_until, last_login_at, last_login_ip, left_at, created_at, updated_at FROM sys_user WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function createUser({ username, passwordHash, nickname }) {
  const [result] = await db.execute(
    'INSERT INTO sys_user (username, password_hash, nickname) VALUES (?, ?, ?)',
    [username, passwordHash, nickname || null]
  );
  return result.insertId;
}

async function updateLoginSuccess(userId, ipAddress) {
  await db.execute(
    `UPDATE sys_user
     SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ?
     WHERE id = ?`,
    [ipAddress, userId]
  );
}

async function updateLoginFail(userId, failedLoginCount, lockedUntil) {
  await db.execute(
    `UPDATE sys_user
     SET failed_login_count = ?, locked_until = ?
     WHERE id = ?`,
    [failedLoginCount, lockedUntil, userId]
  );
}

async function markLeft(userId) {
  await db.execute(
    `UPDATE sys_user
     SET status = 'DISABLED', left_at = NOW(), locked_until = NOW()
     WHERE id = ?`,
    [userId]
  );
}

async function createLoginLog({ userId, username, success, ipAddress, deviceInfo, failReason }) {
  await db.execute(
    `INSERT INTO sys_login_log (user_id, username, success, ip_address, device_info, fail_reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, username, success ? 1 : 0, ipAddress, deviceInfo || null, failReason || null]
  );
}

async function getMfaFactor(userId, factorType = 'TOTP') {
  const [rows] = await db.execute(
    'SELECT * FROM sys_mfa_factor WHERE user_id = ? AND factor_type = ? AND enabled = 1 LIMIT 1',
    [userId, factorType]
  );
  return rows[0] || null;
}

async function upsertMfaFactor({ userId, factorType = 'TOTP', secretBase32 }) {
  await db.execute(
    `INSERT INTO sys_mfa_factor (user_id, factor_type, secret_base32, enabled, verified_at)
     VALUES (?, ?, ?, 1, NOW())
     ON DUPLICATE KEY UPDATE secret_base32 = VALUES(secret_base32), enabled = 1, verified_at = NOW()`,
    [userId, factorType, secretBase32]
  );
}

async function markMfaUsed(userId, factorType = 'TOTP') {
  await db.execute(
    'UPDATE sys_mfa_factor SET last_used_at = NOW() WHERE user_id = ? AND factor_type = ?',
    [userId, factorType]
  );
}

module.exports = {
  findByUsername,
  findById,
  createUser,
  updateLoginSuccess,
  updateLoginFail,
  markLeft,
  createLoginLog,
  getMfaFactor,
  upsertMfaFactor,
  markMfaUsed
};
