const bcrypt = require('bcrypt');
const db = require('../config/db');

const saltRounds = Number(process.env.SALT_ROUNDS || 10);

async function ensureSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sys_mfa_factor (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      factor_type ENUM('TOTP') NOT NULL DEFAULT 'TOTP',
      secret_base32 VARCHAR(255) NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      verified_at DATETIME DEFAULT NULL,
      last_used_at DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_user_factor (user_id, factor_type),
      CONSTRAINT fk_mfa_user FOREIGN KEY (user_id) REFERENCES sys_user(id)
    )
  `);

  const [columns] = await db.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'sys_user'
       AND COLUMN_NAME = 'left_at'`
  );

  if (!columns.length) {
    await db.execute(`
      ALTER TABLE sys_user
      ADD COLUMN left_at DATETIME DEFAULT NULL
    `);
  }
}

async function ensureSeedData() {
  await db.execute(
    `INSERT IGNORE INTO sys_role (id, role_code, role_name, role_desc)
     VALUES
       (1, 'EMPLOYEE', '普通员工', '只能查看自己的信息'),
       (2, 'ADMIN', '管理员', '可以管理所有用户'),
       (3, 'AUDITOR', '审计员', '只能查看日志')`
  );

  await db.execute(
    `INSERT IGNORE INTO sys_permission (id, perm_code, perm_name, resource_type, resource_path, action)
     VALUES
       (1, 'user:self:read', '查看自己的信息', 'API', '/api/users/me', 'READ'),
       (2, 'user:manage:all', '管理所有用户', 'API', '/api/users', 'MANAGE'),
       (3, 'audit:log:read', '查看审计日志', 'API', '/api/audit/logs', 'READ')`
  );

  await db.execute(
    `INSERT IGNORE INTO sys_role_permission (role_id, permission_id)
     VALUES
       (1, 1),
       (2, 1),
       (2, 2),
       (2, 3),
       (3, 3)`
  );
}

async function upsertDemoUser({ username, nickname, password, roles }) {
  const passwordHash = await bcrypt.hash(password, saltRounds);
  await db.execute(
    `INSERT INTO sys_user (username, password_hash, nickname, status, failed_login_count, locked_until, left_at)
     VALUES (?, ?, ?, 'ACTIVE', 0, NULL, NULL)
     ON DUPLICATE KEY UPDATE
       password_hash = VALUES(password_hash),
       nickname = VALUES(nickname),
       status = 'ACTIVE',
       failed_login_count = 0,
       locked_until = NULL,
       left_at = NULL`,
    [username, passwordHash, nickname]
  );

  const [[user]] = await db.execute('SELECT id FROM sys_user WHERE username = ? LIMIT 1', [username]);
  await db.execute('DELETE FROM sys_user_role WHERE user_id = ?', [user.id]);

  for (const roleCode of roles) {
    const [[role]] = await db.execute('SELECT id FROM sys_role WHERE role_code = ? LIMIT 1', [roleCode]);
    if (role) {
      await db.execute(
        'INSERT IGNORE INTO sys_user_role (user_id, role_id, assigned_by) VALUES (?, ?, ?)',
        [user.id, role.id, user.id]
      );
    }
  }
}

async function repairLegacyTextData() {
  await db.execute(
    `UPDATE sys_role
     SET role_name = CASE role_code
       WHEN 'EMPLOYEE' THEN '普通员工'
       WHEN 'ADMIN' THEN '管理员'
       WHEN 'AUDITOR' THEN '审计员'
       ELSE role_name
     END,
     role_desc = CASE role_code
       WHEN 'EMPLOYEE' THEN '只能查看自己的信息'
       WHEN 'ADMIN' THEN '可以管理所有用户'
       WHEN 'AUDITOR' THEN '只能查看日志'
       ELSE role_desc
     END`
  );

  await db.execute(
    `UPDATE sys_permission
     SET perm_name = CASE perm_code
       WHEN 'user:self:read' THEN '查看自己的信息'
       WHEN 'user:manage:all' THEN '管理所有用户'
       WHEN 'audit:log:read' THEN '查看审计日志'
       ELSE perm_name
     END`
  );
}

async function bootstrapDemoData() {
  await ensureSchema();
  await ensureSeedData();
  await repairLegacyTextData();

  await upsertDemoUser({
    username: 'admin1',
    nickname: '系统管理员',
    password: '123456',
    roles: ['ADMIN']
  });

  await upsertDemoUser({
    username: 'employee01',
    nickname: '普通员工演示',
    password: '123456',
    roles: ['EMPLOYEE']
  });

  await upsertDemoUser({
    username: 'auditor01',
    nickname: '审计员演示',
    password: '123456',
    roles: ['AUDITOR']
  });

  await db.execute(
    `UPDATE sys_mfa_factor
     SET enabled = 0
     WHERE user_id IN (
       SELECT id FROM sys_user WHERE username IN ('admin1', 'employee01', 'auditor01')
     )`
  );
}

module.exports = { bootstrapDemoData };
