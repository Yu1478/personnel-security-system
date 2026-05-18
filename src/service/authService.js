const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { secret, expiresIn } = require('../config/jwt');
const userDao = require('../dao/userDao');

const failLimit = Number(process.env.LOGIN_FAIL_LIMIT || 5);
const lockMinutes = Number(process.env.LOGIN_LOCK_MINUTES || 15);
const saltRounds = Number(process.env.SALT_ROUNDS || 10);

async function register({ username, password, nickname }) {
  const existed = await userDao.findByUsername(username);
  if (existed) {
    throw new Error('Username already exists');
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  const userId = await userDao.createUser({ username, passwordHash, nickname });
  return { userId };
}

async function login({ username, password, ipAddress, deviceInfo }) {
  const user = await userDao.findByUsername(username);
  if (!user) {
    await userDao.createLoginLog({
      userId: null,
      username,
      success: false,
      ipAddress,
      deviceInfo,
      failReason: 'User not found'
    });
    throw new Error('Invalid username or password');
  }

  if (user.status === 'DISABLED') {
    await userDao.createLoginLog({
      userId: user.id,
      username,
      success: false,
      ipAddress,
      deviceInfo,
      failReason: 'Account disabled'
    });
    throw new Error('Account disabled');
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    await userDao.createLoginLog({
      userId: user.id,
      username,
      success: false,
      ipAddress,
      deviceInfo,
      failReason: 'Account locked'
    });
    throw new Error('Account locked, please try later');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const nextFailCount = user.failed_login_count + 1;
    const lockedUntil = nextFailCount >= failLimit
      ? new Date(Date.now() + lockMinutes * 60 * 1000)
      : null;

    await userDao.updateLoginFail(user.id, nextFailCount, lockedUntil);
    await userDao.createLoginLog({
      userId: user.id,
      username,
      success: false,
      ipAddress,
      deviceInfo,
      failReason: 'Wrong password'
    });

    throw new Error(
      nextFailCount >= failLimit
        ? 'Wrong password, account locked'
        : 'Invalid username or password'
    );
  }

  await userDao.updateLoginSuccess(user.id, ipAddress);
  await userDao.createLoginLog({
    userId: user.id,
    username,
    success: true,
    ipAddress,
    deviceInfo,
    failReason: null
  });

  const mfaFactor = await userDao.getMfaFactor(user.id);
  if (mfaFactor) {
    const tempToken = jwt.sign(
      { id: user.id, username: user.username, mfa: true },
      secret,
      { expiresIn: '5m' }
    );
    return { mfaRequired: true, tempToken };
  }

  const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn });
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      status: user.status
    }
  };
}

async function setupMfa(userId) {
  const generated = speakeasy.generateSecret({ name: `PersonnelSecuritySystem-${userId}` });
  await userDao.upsertMfaFactor({
    userId,
    factorType: 'TOTP',
    secretBase32: generated.base32
  });
  return {
    secretBase32: generated.base32,
    otpauthUrl: generated.otpauth_url
  };
}

async function verifyMfa(tempToken, token) {
  const payload = jwt.verify(tempToken, secret);
  if (!payload?.mfa) {
    throw new Error('Invalid MFA temp token');
  }

  const factor = await userDao.getMfaFactor(payload.id);
  if (!factor) {
    throw new Error('MFA config not found');
  }

  const verified = speakeasy.totp.verify({
    secret: factor.secret_base32,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!verified) {
    throw new Error('MFA verify failed');
  }

  await userDao.markMfaUsed(payload.id);
  const finalToken = jwt.sign({ id: payload.id, username: payload.username }, secret, { expiresIn });
  return { token: finalToken };
}

module.exports = { register, login, setupMfa, verifyMfa };
