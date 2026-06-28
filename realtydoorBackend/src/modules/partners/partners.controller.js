const { success } = require('../../utils/ApiResponse');
const service = require('./partners.service');
const { updateProfileSchema } = require('./partners.validator');
const ApiError = require('../../utils/ApiError');

const VALID_LISTING_STATUSES = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'];

async function submitKyc(req, res, next) {
  try {
    const documentUrls = req.files?.map((f) => f.path) || [];
    const result = await service.submitKyc(req.user.id, documentUrls);
    success(res, result, 'KYC submitted for review. Usually verified within 24 hours.');
  } catch (err) { next(err); }
}

async function getProfile(req, res, next) {
  try {
    const profile = await service.getProfile(req.user.id);
    success(res, profile);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await service.updateProfile(req.user.id, data);
    success(res, profile, 'Profile updated');
  } catch (err) { next(err); }
}

async function getListing(req, res, next) {
  try {
    const listing = await service.getListing(req.user.id, req.params.id);
    success(res, listing);
  } catch (err) { next(err); }
}

async function getMyListings(req, res, next) {
  try {
    const { status } = req.query;
    if (status && !VALID_LISTING_STATUSES.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${VALID_LISTING_STATUSES.join(', ')}`);
    }
    const listings = await service.getMyListings(req.user.id, status);
    success(res, listings);
  } catch (err) { next(err); }
}

async function getFinanceSummary(req, res, next) {
  try {
    const summary = await service.getFinanceSummary(req.user.id);
    success(res, summary);
  } catch (err) { next(err); }
}

async function getAnalytics(req, res, next) {
  try {
    const analytics = await service.getPartnerAnalytics(req.user.id);
    success(res, analytics);
  } catch (err) { next(err); }
}

module.exports = { submitKyc, getProfile, updateProfile, getListing, getMyListings, getFinanceSummary, getAnalytics };
