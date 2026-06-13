'use strict';

/**
 * Anti-leakage rule: PARTNER can never see buyer's full phone until OTP is verified.
 * Rule 1 from PRD §5.
 */
function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 6) + 'XXXXX';
}

function formatPhone(phone, isOtpVerified) {
  return isOtpVerified ? phone : maskPhone(phone);
}

module.exports = { maskPhone, formatPhone };
