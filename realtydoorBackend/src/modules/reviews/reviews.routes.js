const router = require('express').Router({ mergeParams: true });
const ctrl = require('./reviews.controller');
const { authenticate } = require('../../middleware/auth');

// GET /api/properties/:propertyId/reviews — public
router.get('/', ctrl.getPropertyReviews);

// POST /api/properties/:propertyId/reviews — authenticated
router.post('/', authenticate, ctrl.postReview);

module.exports = router;
