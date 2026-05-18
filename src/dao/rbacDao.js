const db = require('../config/db');

async function getUserRoles(userId) {
  const [rows] = await db.execute(
    `SELECT r.id, r.role_code, r.role_name
     FROM sys_user_role ur
     INNER JOIN sys_role r ON ur.role_id = r.id
     WHERE ur.user_id = ? AND r.status = 1`,
    [userId]
  );
  return rows;
}

async function getUserPermissions(userId) {
  const [rows] = await db.execute(
    `SELECT DISTINCT p.perm_code, p.perm_name, p.resource_type, p.resource_path, p.action
     FROM sys_user_role ur
     INNER JOIN sys_role_permission rp ON ur.role_id = rp.role_id
     INNER JOIN sys_permission p ON rp.permission_id = p.id
     WHERE ur.user_id = ? AND p.status = 1`,
    [userId]
  );
  return rows;
}

async function hasPermission(userId, permCode) {
  const [rows] = await db.execute(
    `SELECT 1
     FROM sys_user_role ur
     INNER JOIN sys_role_permission rp ON ur.role_id = rp.role_id
     INNER JOIN sys_permission p ON rp.permission_id = p.id
     WHERE ur.user_id = ? AND p.perm_code = ? AND p.status = 1
     LIMIT 1`,
    [userId, permCode]
  );
  return rows.length > 0;
}

async function assignRole(userId, roleId, assignedBy = null) {
  await db.execute(
    `INSERT IGNORE INTO sys_user_role (user_id, role_id, assigned_by)
     VALUES (?, ?, ?)`,
    [userId, roleId, assignedBy]
  );
}

async function removeRole(userId, roleId) {
  await db.execute(
    'DELETE FROM sys_user_role WHERE user_id = ? AND role_id = ?',
    [userId, roleId]
  );
}

async function findRoleByCode(roleCode) {
  const [rows] = await db.execute(
    'SELECT * FROM sys_role WHERE role_code = ? AND status = 1 LIMIT 1',
    [roleCode]
  );
  return rows[0] || null;
}

module.exports = {
  getUserRoles,
  getUserPermissions,
  hasPermission,
  assignRole,
  removeRole,
  findRoleByCode
};
