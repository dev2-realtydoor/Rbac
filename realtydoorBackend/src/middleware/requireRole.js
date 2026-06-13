const ApiError = require('../utils/ApiError');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

const requireAdmin = requireRole('ADMIN');
const requirePartner = requireRole('PARTNER', 'ADMIN');
const requireUser = requireRole('USER', 'PARTNER', 'ADMIN');

module.exports = { requireRole, requireAdmin, requirePartner, requireUser };
