const { success, created } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./reviews.service');
const { postReviewSchema, moderateReviewSchema } = require('./reviews.validator');

async function postReview(req, res, next) {
  try {
    const data = postReviewSchema.parse({ ...req.body, propertyId: req.params.propertyId });
    const review = await service.postReview(req.user.id, data);
    created(res, review, 'Review submitted — pending moderation');
  } catch (err) { next(err); }
}

async function getPropertyReviews(req, res, next) {
  try {
    const reviews = await service.getPropertyReviews(req.params.propertyId);
    success(res, reviews);
  } catch (err) { next(err); }
}

async function adminListReviews(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.adminListReviews(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function adminModerateReview(req, res, next) {
  try {
    const { action } = moderateReviewSchema.parse(req.body);
    const review = await service.adminModerateReview(req.params.id, action, req.user.id);
    success(res, review, `Review ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
  } catch (err) { next(err); }
}

module.exports = { postReview, getPropertyReviews, adminListReviews, adminModerateReview };
