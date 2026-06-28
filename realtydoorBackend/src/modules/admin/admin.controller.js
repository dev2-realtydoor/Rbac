const { success, created } = require('../../utils/ApiResponse');
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
  createServiceSchema,
  updateServiceSchema,
  createTeamMemberSchema,
  updateTeamMemberSchema,
  verifyDocumentSchema,
  updateVideoTourSchema,
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
    const { data, total } = await service.getPendingKyc(skip, limit, req.query.status);
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
    const { status, vendorName, vendorPhone } = updateTicketSchema.parse(req.body);
    const ticket = await service.updateTicketStatus(req.params.id, status, vendorName, vendorPhone);
    success(res, ticket, 'Ticket updated');
  } catch (err) { next(err); }
}

async function getPropertyById(req, res, next) {
  try {
    const property = await service.getPropertyByIdAdmin(req.params.id);
    success(res, property);
  } catch (err) { next(err); }
}

async function getKycById(req, res, next) {
  try {
    const user = await service.getKycByUserId(req.params.userId);
    success(res, user);
  } catch (err) { next(err); }
}

async function getUserById(req, res, next) {
  try {
    const user = await service.getUserByIdAdmin(req.params.id);
    success(res, user);
  } catch (err) { next(err); }
}

async function listDocuments(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.adminListDocuments(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function verifyDocument(req, res, next) {
  try {
    const { action, note } = verifyDocumentSchema.parse(req.body);
    const doc = await service.adminVerifyDocument(req.params.id, action, note, req.user.id);
    success(res, doc, `Document ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
  } catch (err) { next(err); }
}

async function listContactMessages(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.listContactMessages(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function markContactRead(req, res, next) {
  try {
    const msg = await service.markContactRead(req.params.id);
    success(res, msg, 'Marked as read');
  } catch (err) { next(err); }
}

async function listTeam(req, res, next) {
  try {
    const members = await service.adminListTeam();
    success(res, members);
  } catch (err) { next(err); }
}

async function createTeamMember(req, res, next) {
  try {
    const data = createTeamMemberSchema.parse(req.body);
    const member = await service.adminCreateTeamMember(data);
    created(res, member, 'Team member added');
  } catch (err) { next(err); }
}

async function updateTeamMember(req, res, next) {
  try {
    const data = updateTeamMemberSchema.parse(req.body);
    const member = await service.adminUpdateTeamMember(req.params.id, data);
    success(res, member, 'Team member updated');
  } catch (err) { next(err); }
}

async function deleteTeamMember(req, res, next) {
  try {
    await service.adminDeleteTeamMember(req.params.id);
    success(res, null, 'Team member removed');
  } catch (err) { next(err); }
}

async function getPartnerById(req, res, next) {
  try {
    const partner = await service.getPartnerById(req.params.id);
    success(res, partner);
  } catch (err) { next(err); }
}

async function listServices(req, res, next) {
  try {
    const services = await service.adminListServices();
    success(res, services);
  } catch (err) { next(err); }
}

async function createService(req, res, next) {
  try {
    const data = createServiceSchema.parse(req.body);
    const svc = await service.adminCreateService(data);
    created(res, svc, 'Service created');
  } catch (err) { next(err); }
}

async function updateService(req, res, next) {
  try {
    const data = updateServiceSchema.parse(req.body);
    const svc = await service.adminUpdateService(req.params.id, data);
    success(res, svc, 'Service updated');
  } catch (err) { next(err); }
}

async function deleteService(req, res, next) {
  try {
    await service.adminDeleteService(req.params.id);
    success(res, null, 'Service deactivated');
  } catch (err) { next(err); }
}

async function listVideoTours(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { data, total } = await service.listVideoTours(req.query, skip, limit);
    success(res, paginate(data, total, page, limit));
  } catch (err) { next(err); }
}

async function updateVideoTour(req, res, next) {
  try {
    const data = updateVideoTourSchema.parse(req.body);
    const tour = await service.updateVideoTour(req.params.id, data);
    success(res, tour, 'Video tour updated');
  } catch (err) { next(err); }
}

module.exports = {
  getLeadById, getLeads, assignLead,
  getPendingProperties, approveProperty, rejectProperty, editProperty,
  getPendingKyc, verifyKyc,
  getRevenue, getAuditLogs, getPartnerMetrics,
  getTickets, updateTicket,
  getLoans, updateLoanStatus,
  getUsers, changeUserRole, getUserById,
  getPartnerById,
  getPropertyById,
  getKycById,
  listDocuments, verifyDocument,
  listContactMessages, markContactRead,
  listTeam, createTeamMember, updateTeamMember, deleteTeamMember,
  listServices, createService, updateService, deleteService,
  listVideoTours, updateVideoTour,
};
