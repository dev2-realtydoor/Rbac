const { success, created } = require('../../utils/ApiResponse');
const { submitLeadSchema, scheduleVisitSchema, verifyOtpSchema, uploadDocsSchema } = require('./leads.validator');
const service = require('./leads.service');

async function submit(req, res, next) {
  try {
    const data = submitLeadSchema.parse(req.body);
    const lead = await service.submitLead(data);
    created(res, lead, "We'll reach out within 24 hours");
  } catch (err) { next(err); }
}

async function getMyLeads(req, res, next) {
  try {
    const leads = await service.getPartnerLeads(req.user.id);
    success(res, leads);
  } catch (err) { next(err); }
}

async function getLeadById(req, res, next) {
  try {
    const lead = await service.getPartnerLeadById(req.params.id, req.user.id);
    success(res, lead);
  } catch (err) { next(err); }
}

async function scheduleVisit(req, res, next) {
  try {
    const { scheduledAt } = scheduleVisitSchema.parse(req.body);
    const result = await service.scheduleVisit(req.params.id, req.user.id, scheduledAt);
    success(res, result);
  } catch (err) { next(err); }
}

async function verifyOtp(req, res, next) {
  try {
    const { otp } = verifyOtpSchema.parse(req.body);
    const result = await service.verifyOtp(req.params.id, req.user.id, otp);
    success(res, result);
  } catch (err) { next(err); }
}

async function uploadDocs(req, res, next) {
  try {
    const data = uploadDocsSchema.parse(req.body);
    const fileUrls = {
      visitPhotos: req.files?.visitPhotos?.map((f) => f.path) || [],
      closureDocs: req.files?.closureDocs?.map((f) => f.path) || [],
    };
    const lead = await service.uploadDocs(req.params.id, req.user.id, data, fileUrls);
    success(res, lead, 'Documentation uploaded');
  } catch (err) { next(err); }
}

async function closeLead(req, res, next) {
  try {
    const result = await service.closeLead(req.params.id, req.user.id);
    success(res, result);
  } catch (err) { next(err); }
}

module.exports = { submit, getMyLeads, getLeadById, scheduleVisit, verifyOtp, uploadDocs, closeLead };
