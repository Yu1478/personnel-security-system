const express = require('express');
const { authRequired } = require('../middleware/auth');
const { permissionRequired } = require('../middleware/permission');
const { listLogs } = require('../controller/auditController');

const router = express.Router();

router.get('/logs', authRequired, permissionRequired('audit:log:read'), listLogs);

module.exports = router;
