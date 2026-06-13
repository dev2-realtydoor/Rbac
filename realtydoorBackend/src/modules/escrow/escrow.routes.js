const router = require('express').Router();
const ctrl = require('./escrow.controller');
const { authenticate } = require('../../middleware/auth');
const { requireUser } = require('../../middleware/requireRole');
const { requirePhone } = require('../../middleware/requirePhone');

// Buyer creates escrow order (token advance payment)
router.post('/create-order', authenticate, requireUser, requirePhone, ctrl.createOrder);

module.exports = router;
