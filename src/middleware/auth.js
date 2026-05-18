const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ code: 401, message: 'Missing token', data: null });
  }

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    return res.status(401).json({ code: 401, message: 'Invalid token', data: null });
  }
}

module.exports = { authRequired };
