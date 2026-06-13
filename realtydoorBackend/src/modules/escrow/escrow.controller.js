const { success, created } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./escrow.service');

async function createOrder(req, res, next) {
  try {
    const { leadId, amount } = req.body;
    const result = await service.createOrder(leadId, req.user.id, amount);
    created(res, result, 'Escrow order created');
  } catch (err) { next(err); }
}

async function releaseEscrow(req, res, next) {
  try {
    const { sellerAccountId, partnerShare, platformFee, note } = req.body;
    const escrow = await service.release(req.params.id, req.user.id, { sellerAccountId, partnerShare, platformFee, note }, req.ip);
    success(res, escrow, 'Escrow released');
  } catch (err) { next(err); }
}

async function refundEscrow(req, res, next) {
  try {
    const escrow = await service.refund(req.params.id, req.user.id, req.ip);
    success(res, escrow, 'Escrow refunded');
  } catch (err) { next(err); }
}

async function getAllEscrow(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAllEscrow(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

module.exports = { createOrder, releaseEscrow, refundEscrow, getAllEscrow };
