const { success } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./notifications.service');

async function getMyNotifications(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getMyNotifications(req.user.id, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function markRead(req, res, next) {
  try {
    await service.markRead(req.user.id, req.params.id);
    success(res, null, 'Marked as read');
  } catch (err) { next(err); }
}

async function markAllRead(req, res, next) {
  try {
    await service.markAllRead(req.user.id);
    success(res, null, 'All marked as read');
  } catch (err) { next(err); }
}

async function broadcast(req, res, next) {
  try {
    const result = await service.broadcast(req.body);
    success(res, result, 'Broadcast sent');
  } catch (err) { next(err); }
}

module.exports = { getMyNotifications, markRead, markAllRead, broadcast };
