const express = require('express');
const { register, login } = require('../controller/authController');
const { setup, verify } = require('../controller/mfaController');
const { authRequired } = require('../middleware/auth');
const userDao = require('../dao/userDao');
const rbacDao = require('../dao/rbacDao');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/mfa/verify', verify);
router.post('/mfa/setup', authRequired, setup);
router.get('/me', authRequired, async (req, res) => {
  const user = await userDao.findById(req.user.id);
  const roles = await rbacDao.getUserRoles(req.user.id);
  const permissions = await rbacDao.getUserPermissions(req.user.id);
  return res.json({ code: 0, message: 'OK', data: { ...user, roles, permissions } });
});

module.exports = router;
