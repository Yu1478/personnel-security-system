const authService = require('../service/authService');
const { ok, fail } = require('../utils/response');

async function setup(req, res) {
  try {
    const data = await authService.setupMfa(req.user.id);
    return ok(res, data, 'MFA enabled');
  } catch (err) {
    return fail(res, err.message || 'MFA setup failed');
  }
}

async function verify(req, res) {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      return fail(res, 'tempToken and token are required');
    }
    const data = await authService.verifyMfa(tempToken, token);
    return ok(res, data, 'MFA verify success');
  } catch (err) {
    return fail(res, err.message || 'MFA verify failed', 1, 401);
  }
}

module.exports = { setup, verify };
