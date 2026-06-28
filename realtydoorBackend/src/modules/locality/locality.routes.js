const router = require('express').Router();
const ctrl = require('./locality.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/requireRole');

// Public — property detail page fetches this (requires ?city=&locality=)
router.get('/insight',        ctrl.getLocality);
// Public — homepage city cards aggregate
router.get('/cities-summary', ctrl.getCitiesSummary);

// Admin-only management
router.get('/',        authenticate, requireAdmin, ctrl.listLocalities);
router.get('/:id',     authenticate, requireAdmin, ctrl.getLocalityById);
router.post('/',       authenticate, requireAdmin, ctrl.upsertLocality);
router.delete('/:id',  authenticate, requireAdmin, ctrl.deleteLocality);

module.exports = router;
