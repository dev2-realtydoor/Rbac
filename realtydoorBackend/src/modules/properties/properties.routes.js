const router = require('express').Router();
const ctrl = require('./properties.controller');
const { authenticate } = require('../../middleware/auth');
const { requirePartner } = require('../../middleware/requireRole');
const { requireKyc } = require('../../middleware/requireKyc');
const { propertyImageUploader, propertyVideoUploader } = require('../../lib/fileUpload');

// Public
router.get('/', ctrl.search);
router.get('/featured', ctrl.getFeatured);
router.get('/:slug', ctrl.getBySlug);

// Partner (KYC required)
router.post('/', authenticate, requirePartner, requireKyc, ctrl.create);
router.patch('/:id', authenticate, requirePartner, requireKyc, ctrl.update);
router.post('/:id/images', authenticate, requirePartner, propertyImageUploader.array('images', 10), ctrl.uploadImages);
router.post('/:id/videos', authenticate, requirePartner, propertyVideoUploader.array('videos', 5), ctrl.uploadVideos);

module.exports = router;
