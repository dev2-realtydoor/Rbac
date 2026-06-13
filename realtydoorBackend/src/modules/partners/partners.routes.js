const router = require('express').Router();
const ctrl = require('./partners.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePartner } = require('../../middleware/requireRole');
const { requireKyc } = require('../../middleware/requireKyc');
const { kycDocUploader } = require('../../lib/fileUpload');
const { uploadLimiter } = require('../../middleware/rateLimiter');

router.use(authenticate, requirePartner);

// KYC submission (no KYC required to submit it)
router.post('/kyc', uploadLimiter, kycDocUploader.array('documents', 5), ctrl.submitKyc);

// Profile
router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);

// Listings (KYC required)
router.get('/listings',    requireKyc, ctrl.getMyListings);
router.get('/listings/:id', requireKyc, ctrl.getListing);

// Finance/escrow summary (KYC required)
router.get('/finance', requireKyc, ctrl.getFinanceSummary);

module.exports = router;
