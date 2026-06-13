const ApiError = require('../utils/ApiError');

// Partners must have kycStatus: VERIFIED to access protected partner routes
function requireKyc(req, res, next) {
  if (req.user?.role === 'ADMIN') return next();
  if (req.user?.kycStatus !== 'VERIFIED') {
    return next(new ApiError(403, 'KYC verification required to access this resource'));
  }
  next();
}

module.exports = { requireKyc };
