const { success } = require('../../utils/ApiResponse');
const { parsePagination, paginate } = require('../../utils/pagination');
const service = require('./admin.service');
const {
  assignLeadSchema,
  rejectPropertySchema,
  verifyKycSchema,
  updateLoanStatusSchema,
  changeUserRoleSchema,
  editPropertySchema,
  updateTicketSchema,
} = require('./admin.validator');

async function getLeadById(req, res, next) {
  try {
    const lead = await service.getLeadById(req.params.id);
    success(res, lead);
  } catch (err) { next(err); }
}

async function getLeads(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAllLeads(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function assignLead(req, res, next) {
  try {
    const { partnerId } = assignLeadSchema.parse(req.body);
    const lead = await service.assignLead(req.params.id, partnerId, req.user.id, req.ip);
    success(res, lead, 'Lead assigned');
  } catch (err) { next(err); }
}

async function getPendingProperties(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getPendingProperties(skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function approveProperty(req, res, next) {
  try {
    const property = await service.approveProperty(req.params.id, req.user.id, req.ip);
    success(res, property, 'Property approved');
  } catch (err) { next(err); }
}

async function rejectProperty(req, res, next) {
  try {
    const { note } = rejectPropertySchema.parse(req.body);
    const property = await service.rejectProperty(req.params.id, note, req.user.id, req.ip);
    success(res, property, 'Property rejected');
  } catch (err) { next(err); }
}

async function getPendingKyc(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getPendingKyc(skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function verifyKyc(req, res, next) {
  try {
    const { action, note } = verifyKycSchema.parse(req.body);
    const updated = await service.verifyKyc(req.params.userId, action, note, req.user.id, req.ip);
    success(res, updated, `KYC ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
  } catch (err) { next(err); }
}

async function getRevenue(req, res, next) {
  try {
    const summary = await service.getRevenueSummary();
    success(res, summary);
  } catch (err) { next(err); }
}

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAuditLogs(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function getPartnerMetrics(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getPartnerMetrics(skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAllUsers(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function changeUserRole(req, res, next) {
  try {
    const { role } = changeUserRoleSchema.parse(req.body);
    const updated = await service.changeUserRole(req.params.id, role, req.user.id, req.ip);
    success(res, updated, `Role updated to ${role}`);
  } catch (err) { next(err); }
}

async function editProperty(req, res, next) {
  try {
    const data = editPropertySchema.parse(req.body);
    const property = await service.editProperty(
      req.params.id, data, req.user.id, req.user.name, req.ip,
    );
    success(res, property, 'Property updated');
  } catch (err) { next(err); }
}

async function getLoans(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAllLoans(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function updateLoanStatus(req, res, next) {
  try {
    const { status, adminNote } = updateLoanStatusSchema.parse(req.body);
    const loan = await service.updateLoanStatus(req.params.id, status, adminNote, req.user.id);
    success(res, loan, 'Loan status updated');
  } catch (err) { next(err); }
}

async function getTickets(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.getAllTickets(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function updateTicket(req, res, next) {
  try {
    const { status } = updateTicketSchema.parse(req.body);
    const ticket = await service.updateTicketStatus(req.params.id, status);
    success(res, ticket, `Ticket ${status.toLowerCase().replace('_', ' ')}`);
  } catch (err) { next(err); }
}

module.exports = {
  getLeadById, getLeads, assignLead,
  getPendingProperties, approveProperty, rejectProperty, editProperty,
  getPendingKyc, verifyKyc,
  getRevenue, getAuditLogs, getPartnerMetrics,
  getTickets, updateTicket,
  getLoans, updateLoanStatus,
  getUsers, changeUserRole,
};
