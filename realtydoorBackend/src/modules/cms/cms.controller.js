const { success, created, noContent } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./cms.service');

async function getPublished(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getPublished(req.query.type, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function getBySlug(req, res, next) {
  try {
    const block = await service.getBySlug(req.params.slug);
    success(res, block);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const block = await service.create(req.body);
    created(res, block);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const block = await service.update(req.params.id, req.body);
    success(res, block);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await service.remove(req.params.id);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getPublished, getBySlug, create, update, remove };
