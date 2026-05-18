const db = require('../config/db');
const { ok } = require('../utils/response');

async function listLogs(req, res) {
  const [rows] = await db.execute(
    `SELECT id, trace_id, operator_id, operator_name_snapshot, operator_username_snapshot,
            module, action, target_type, target_id, result, ip_address, location, created_at
     FROM sys_operation_audit_log
     ORDER BY id DESC
     LIMIT 200`
  );
  return ok(res, rows);
}

module.exports = { listLogs };
