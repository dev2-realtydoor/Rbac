const router = require('express').Router();
const ctrl = require('./services.controller');
const { authenticate } = require('../../middleware/auth');
const { requireUser } = require('../../middleware/requireRole');
const { requirePhone } = require('../../middleware/requirePhone');

router.get('/', ctrl.getAll);
router.post('/create-order',   authenticate, requireUser, requirePhone, ctrl.createOrder);
router.post('/verify-payment', authenticate, requireUser, ctrl.verifyPayment);

module.exports = router;
