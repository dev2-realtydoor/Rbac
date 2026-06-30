const { success } = require('../../utils/ApiResponse');
const service = require('./config.service');
const { upsertConfigSchema } = require('./config.validator');

async function getPublicConfig(req, res, next) {
  try {
    const config = await service.getPublicConfig();
    success(res, config);
  } catch (err) { next(err); }
}

async function adminListConfig(req, res, next) {
  try {
    const config = await service.adminListConfig();
    success(res, config);
  } catch (err) { next(err); }
}

async function adminUpsertConfig(req, res, next) {
  try {
    const data = upsertConfigSchema.parse(req.body);
    const entry = await service.adminUpsertConfig(req.params.key, data, req.user.id);
    success(res, entry, 'Config updated');
  } catch (err) { next(err); }
}

async function adminDeleteConfig(req, res, next) {
  try {
    await service.adminDeleteConfig(req.params.key);
    success(res, null, 'Config key deleted');
  } catch (err) { next(err); }
}

module.exports = { getPublicConfig, adminListConfig, adminUpsertConfig, adminDeleteConfig };
