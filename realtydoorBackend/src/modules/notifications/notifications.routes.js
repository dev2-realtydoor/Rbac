const router = require('express').Router();
const ctrl = require('./notifications.controller');
const { authenticate } = require('../../middleware/auth');
const { requireUser } = require('../../middleware/requireRole');

router.use(authenticate, requireUser);

router.get('/', ctrl.getMyNotifications);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);

module.exports = router;
