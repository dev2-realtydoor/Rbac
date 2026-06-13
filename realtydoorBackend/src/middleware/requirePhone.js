const ApiError = require('../utils/ApiError');

// Lazy phone verification — only required for transactional actions (PRD §2.5)
function requirePhone(req, res, next) {
  if (!req.user?.phoneVerified) {
    return next(new ApiError(403, 'Phone verification required', { code: 'PHONE_NOT_VERIFIED' }));
  }
  next();
}

module.exports = { requirePhone };
