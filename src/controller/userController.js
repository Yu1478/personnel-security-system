const db = require('../config/db');
const userDao = require('../dao/userDao');
const rbacDao = require('../dao/rbacDao');
const auditDao = require('../dao/auditDao');
const { ok, fail } = require('../utils/response');

async function me(req, res) {
  const user = await userDao.findById(req.user.id);
  const roles = await rbacDao.getUserRoles(req.user.id);
  const permissions = await rbacDao.getUserPermissions(req.user.id);
  return ok(res, { ...user, roles, permissions });
}

async function listUsers(req, res) {
  const [rows] = await db.execute(
    `SELECT
        u.id,
        u.username,
        u.nickname,
        u.status,
        u.left_at,
        u.created_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT r.role_code ORDER BY r.role_code SEPARATOR ', ') AS roles
      FROM sys_user u
      LEFT JOIN sys_user_role ur ON u.id = ur.user_id
      LEFT JOIN sys_role r ON ur.role_id = r.id
      GROUP BY u.id, u.username, u.nickname, u.status, u.left_at, u.created_at, u.updated_at
      ORDER BY u.id DESC`
  );
  return ok(res, rows);
}

async function setRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { roleCode, action = 'assign' } = req.body;
    if (!roleCode) return fail(res, 'roleCode is required');

    const role = await rbacDao.findRoleByCode(roleCode);
    if (!role) return fail(res, 'Role not found');

    if (action === 'remove') {
      await rbacDao.removeRole(userId, role.id);
      await auditDao.createOperationLog({
        traceId: req.traceId,
        operatorId: req.user.id,
        operatorNameSnapshot: req.user.username,
        operatorUsernameSnapshot: req.user.username,
        module: 'RBAC',
        action: 'REMOVE_ROLE',
        targetType: 'USER',
        targetId: String(userId),
        beforeData: { roleCode },
        afterData: { roleCode, action: 'removed' },
        result: 'SUCCESS',
        ipAddress: req.ip
      });
      return ok(res, null, 'Role removed');
    }

    await rbacDao.assignRole(userId, role.id, req.user.id);
    await auditDao.createOperationLog({
      traceId: req.traceId,
      operatorId: req.user.id,
      operatorNameSnapshot: req.user.username,
      operatorUsernameSnapshot: req.user.username,
      module: 'RBAC',
      action: 'ASSIGN_ROLE',
      targetType: 'USER',
      targetId: String(userId),
      beforeData: { roleCode },
      afterData: { roleCode, action: 'assigned' },
      result: 'SUCCESS',
      ipAddress: req.ip
    });
    return ok(res, null, 'Role assigned');
  } catch (err) {
    return fail(res, err.message || 'Operation failed');
  }
}

async function setLeft(req, res) {
  try {
    const userId = Number(req.params.id);
    const before = await userDao.findById(userId);
    if (!before) return fail(res, 'User not found', 1, 404);

    await userDao.markLeft(userId);
    await auditDao.createOperationLog({
      traceId: req.traceId,
      operatorId: req.user.id,
      operatorNameSnapshot: req.user.username,
      operatorUsernameSnapshot: req.user.username,
      module: 'USER',
      action: 'MARK_LEFT',
      targetType: 'USER',
      targetId: String(userId),
      beforeData: before,
      afterData: { ...before, status: 'DISABLED', left_at: new Date().toISOString() },
      result: 'SUCCESS',
      ipAddress: req.ip
    });
    return ok(res, null, 'User marked as left and frozen');
  } catch (err) {
    return fail(res, err.message || 'Operation failed');
  }
}

module.exports = { me, listUsers, setRole, setLeft };
