const router = require('express').Router();
const ctrl = require('./admin.controller');
const escrowCtrl = require('../escrow/escrow.controller');
const cmsCtrl = require('../cms/cms.controller');
const notifCtrl = require('../notifications/notifications.controller');
const leadsCtrl = require('../leads/leads.controller');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/requireRole');

router.use(authenticate, requireAdmin);

// Lead management
router.get('/leads',        ctrl.getLeads);
router.get('/leads/:id',    ctrl.getLeadById);
router.patch('/leads/:id/assign',        ctrl.assignLead);
router.patch('/leads/:id/approve-drop',  leadsCtrl.approveDrop);
router.patch('/leads/:id/reject-drop',   leadsCtrl.rejectDrop);

// Property approval + admin edit
router.get('/properties',              ctrl.getPendingProperties);
router.get('/properties/:id',          ctrl.getPropertyById);
router.patch('/properties/:id/approve', ctrl.approveProperty);
router.patch('/properties/:id/reject',  ctrl.rejectProperty);
router.patch('/properties/:id',         ctrl.editProperty);

// KYC
router.get('/kyc',                ctrl.getPendingKyc);
router.get('/kyc/:userId',        ctrl.getKycById);
router.patch('/kyc/:userId/verify', ctrl.verifyKyc);

// Revenue
router.get('/revenue', ctrl.getRevenue);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

// Partner metrics + drill-down
router.get('/partners',     ctrl.getPartnerMetrics);
router.get('/partners/:id', ctrl.getPartnerById);

// Escrow (admin actions)
router.patch('/escrow/:id/release', escrowCtrl.releaseEscrow);
router.post('/escrow/:id/refund', escrowCtrl.refundEscrow);
router.get('/escrow', escrowCtrl.getAllEscrow);

// CMS
router.get('/content',        cmsCtrl.getAllForAdmin);
router.get('/content/:id',    cmsCtrl.getByIdForAdmin);
router.post('/content',       cmsCtrl.create);
router.patch('/content/:id',  cmsCtrl.update);
router.delete('/content/:id', cmsCtrl.remove);

// Notifications
router.post('/notifications/broadcast', notifCtrl.broadcast);

// Ticket management
router.get('/tickets',            ctrl.getTickets);
router.patch('/tickets/:id',      ctrl.updateTicket);

// Loan management
router.get('/loan',               ctrl.getLoans);
router.patch('/loan/:id/status',  ctrl.updateLoanStatus);

// User management & role assignment
router.get('/users',              ctrl.getUsers);
router.get('/users/:id',          ctrl.getUserById);
router.patch('/users/:id/role',   ctrl.changeUserRole);

// Service catalog management
router.get('/services',         ctrl.listServices);
router.post('/services',        ctrl.createService);
router.patch('/services/:id',   ctrl.updateService);
router.delete('/services/:id',  ctrl.deleteService);

// User document vault review (Pattern 12)
router.get('/documents',               ctrl.listDocuments);
router.patch('/documents/:id/verify',  ctrl.verifyDocument);

// Contact inbox
router.get('/contact',             ctrl.listContactMessages);
router.patch('/contact/:id/read',  ctrl.markContactRead);

// Team roster
router.get('/team',          ctrl.listTeam);
router.post('/team',         ctrl.createTeamMember);
router.patch('/team/:id',    ctrl.updateTeamMember);
router.delete('/team/:id',   ctrl.deleteTeamMember);

// Video tour requests
router.get('/video-tours',        ctrl.listVideoTours);
router.patch('/video-tours/:id',  ctrl.updateVideoTour);

module.exports = router;
