const { success, created } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./disputes.service');
const { raiseDisputeSchema, resolveDisputeSchema } = require('./disputes.validator');

async function raiseDispute(req, res, next) {
  try {
    const data = raiseDisputeSchema.parse(req.body);
    const dispute = await service.raiseDispute(req.user.id, data);
    created(res, dispute, 'Dispute raised');
  } catch (err) { next(err); }
}

async function getMyDisputes(req, res, next) {
  try {
    const disputes = await service.getMyDisputes(req.user.id);
    success(res, disputes);
  } catch (err) { next(err); }
}

async function adminListDisputes(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.adminListDisputes(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function adminResolveDispute(req, res, next) {
  try {
    const data = resolveDisputeSchema.parse(req.body);
    const dispute = await service.adminResolveDispute(req.params.id, data, req.user.id);
    success(res, dispute, 'Dispute updated');
  } catch (err) { next(err); }
}

module.exports = { raiseDispute, getMyDisputes, adminListDisputes, adminResolveDispute };
