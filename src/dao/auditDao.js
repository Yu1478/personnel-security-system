const db = require('../config/db');

async function createOperationLog(payload) {
  const {
    traceId,
    operatorId,
    operatorNameSnapshot,
    operatorUsernameSnapshot,
    module,
    action,
    targetType = null,
    targetId = null,
    beforeData = null,
    afterData = null,
    result,
    errorMessage = null,
    ipAddress,
    location = null
  } = payload;

  await db.execute(
    `INSERT INTO sys_operation_audit_log
     (trace_id, operator_id, operator_name_snapshot, operator_username_snapshot, module, action,
      target_type, target_id, before_data, after_data, result, error_message, ip_address, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      traceId,
      operatorId,
      operatorNameSnapshot,
      operatorUsernameSnapshot,
      module,
      action,
      targetType,
      targetId,
      beforeData ? JSON.stringify(beforeData) : null,
      afterData ? JSON.stringify(afterData) : null,
      result,
      errorMessage,
      ipAddress,
      location
    ]
  );
}

module.exports = { createOperationLog };
