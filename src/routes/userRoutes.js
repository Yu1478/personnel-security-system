const express = require('express');
const { authRequired } = require('../middleware/auth');
const { permissionRequired } = require('../middleware/permission');
const userController = require('../controller/userController');

const router = express.Router();

router.get('/me', authRequired, permissionRequired('user:self:read'), userController.me);
router.get('/', authRequired, permissionRequired('user:manage:all'), userController.listUsers);
router.put('/:id/roles', authRequired, permissionRequired('user:manage:all'), userController.setRole);
router.post('/:id/leave', authRequired, permissionRequired('user:manage:all'), userController.setLeft);

module.exports = router;
