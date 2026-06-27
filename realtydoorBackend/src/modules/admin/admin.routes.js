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
router.get('/properties', ctrl.getPendingProperties);
router.patch('/properties/:id/approve', ctrl.approveProperty);
router.patch('/properties/:id/reject', ctrl.rejectProperty);
router.patch('/properties/:id', ctrl.editProperty);

// KYC
router.get('/kyc', ctrl.getPendingKyc);
router.patch('/kyc/:userId/verify', ctrl.verifyKyc);

// Revenue
router.get('/revenue', ctrl.getRevenue);

// Audit logs
router.get('/audit-logs', ctrl.getAuditLogs);

// Partner metrics
router.get('/partners', ctrl.getPartnerMetrics);

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
router.patch('/users/:id/role',   ctrl.changeUserRole);

module.exports = router;
