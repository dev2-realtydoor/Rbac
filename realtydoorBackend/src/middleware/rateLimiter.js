const rateLimit = require('express-rate-limit');

const BASE = {
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
};

const defaultLimiter = rateLimit({
  ...BASE,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const otpLimiter = rateLimit({
  ...BASE,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 1 hour.' },
});

const authLimiter = rateLimit({
  ...BASE,
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' },
});

const uploadLimiter = rateLimit({
  ...BASE,
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Upload limit reached. Try again later.' },
});

module.exports = { defaultLimiter, otpLimiter, authLimiter, uploadLimiter };
