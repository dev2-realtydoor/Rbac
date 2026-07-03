const { z } = require('zod');

const updateProfileSchema = z.object({
  name:            z.string().min(2).max(100).optional(),
  companyName:     z.string().min(2).max(200).optional(),
  bio:             z.string().max(1000).optional(),
  websiteUrl:      z.string().url('Invalid URL').optional().or(z.literal('')),
  profileImageUrl: z.string().url('Invalid URL').optional(),
  partnerSubType:  z.string().max(50).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_RE    = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM

const updateSettingsSchema = z.object({
  visitDays:               z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])).optional(),
  visitFromTime:           z.string().regex(TIME_RE, 'Use HH:MM format').optional(),
  visitToTime:             z.string().regex(TIME_RE, 'Use HH:MM format').optional(),
  notifNewLead:            z.boolean().optional(),
  notifLeadExpiring:       z.boolean().optional(),
  notifEscrowReleased:     z.boolean().optional(),
  notifListingUpdate:      z.boolean().optional(),
  notifWeeklyReport:       z.boolean().optional(),
  leadAutoAccept:          z.boolean().optional(),
  leadPauseOverloaded:     z.boolean().optional(),
  leadPreferredLocalities: z.array(z.string().max(100)).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const updateBankAccountSchema = z.object({
  bankName:               z.string().min(2).max(100),
  bankBranch:             z.string().min(2).max(100).optional(),
  bankAccountNo:          z.string().min(5).max(20),
  bankIfsc:               z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  bankHolderName:         z.string().min(2).max(100),
  razorpayRouteAccountId: z.string().min(5).max(50).optional(),
});

const createSupportTicketSchema = z.object({
  subject:     z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  category:    z.enum(['LEAD', 'ESCROW', 'LISTING', 'PAYMENT', 'GENERAL']).optional(),
});

module.exports = {
  updateProfileSchema,
  updateSettingsSchema,
  updateBankAccountSchema,
  createSupportTicketSchema,
};
