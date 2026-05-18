const authService = require('../service/authService');
const { ok, fail } = require('../utils/response');

async function register(req, res) {
  try {
    const { username, password, nickname } = req.body;
    if (!username || !password) {
      return fail(res, 'username and password are required');
    }
    const data = await authService.register({ username, password, nickname });
    return ok(res, data, 'Register success');
  } catch (err) {
    return fail(res, err.message || 'Register failed');
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return fail(res, 'username and password are required');
    }
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    const deviceInfo = req.headers['user-agent'] || '';
    const data = await authService.login({ username, password, ipAddress, deviceInfo });
    return ok(res, data, 'Login success');
  } catch (err) {
    return fail(res, err.message || 'Login failed', 1, 401);
  }
}

module.exports = { register, login };
