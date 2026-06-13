const router = require('express').Router();
const ctrl = require('./cms.controller');

// Public
router.get('/', ctrl.getPublished);
router.get('/:slug', ctrl.getBySlug);

module.exports = router;
