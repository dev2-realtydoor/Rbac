const crypto = require('crypto');

const EXPIRY_MS = Number(process.env.OTP_EXPIRY_MINUTES || 120) * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 3);

function generate() {
  return String(crypto.randomInt(1000, 9999)).padStart(4, '0');
}

function expiresAt() {
  return new Date(Date.now() + EXPIRY_MS);
}

function isExpired(otpExpiresAt) {
  return !otpExpiresAt || new Date() > new Date(otpExpiresAt);
}

function isLocked(otpLockedUntil) {
  return otpLockedUntil && new Date() < new Date(otpLockedUntil);
}

function lockUntil() {
  return new Date(Date.now() + 30 * 60 * 1000); // 30-min lock
}

function maxAttemptsReached(attempts) {
  return attempts >= MAX_ATTEMPTS;
}

module.exports = { generate, expiresAt, isExpired, isLocked, lockUntil, maxAttemptsReached, MAX_ATTEMPTS };
