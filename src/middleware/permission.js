const rbacDao = require('../dao/rbacDao');

function permissionRequired(permCode) {
  return async (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ code: 401, message: 'Missing token', data: null });
    }

    const allowed = await rbacDao.hasPermission(req.user.id, permCode);
    if (!allowed) {
      return res.status(403).json({ code: 403, message: 'Permission denied', data: null });
    }

    next();
  };
}

module.exports = { permissionRequired };
