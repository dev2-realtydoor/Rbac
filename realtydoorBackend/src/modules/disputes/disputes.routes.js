const router = require('express').Router();
const ctrl = require('./disputes.controller');
const { authenticate } = require('../../middleware/auth');
const { requireUser } = require('../../middleware/requireRole');

router.use(authenticate, requireUser);

router.post('/', ctrl.raiseDispute);
router.get('/', ctrl.getMyDisputes);

module.exports = router;
