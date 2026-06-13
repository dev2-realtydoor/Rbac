const { success, created } = require('../../utils/ApiResponse');
const service = require('./services.service');

async function getAll(req, res, next) {
  try {
    const services = await service.getAllServices();
    success(res, services);
  } catch (err) { next(err); }
}

async function createOrder(req, res, next) {
  try {
    const { serviceId } = req.body;
    const result = await service.createServiceOrder(req.user.id, serviceId);
    created(res, result, 'Order created');
  } catch (err) { next(err); }
}

module.exports = { getAll, createOrder };
