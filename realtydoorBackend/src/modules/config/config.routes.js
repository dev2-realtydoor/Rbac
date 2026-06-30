const router = require('express').Router();
const ctrl = require('./config.controller');

// GET /api/config/public — no auth required
router.get('/public', ctrl.getPublicConfig);

module.exports = router;
