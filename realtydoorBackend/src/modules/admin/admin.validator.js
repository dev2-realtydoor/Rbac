const { z } = require('zod');
const { objectId } = require('../../utils/validators');

const assignLeadSchema = z.object({
  partnerId: objectId,
});

const rejectPropertySchema = z.object({
  note: z.string().min(5, 'Rejection note must be at least 5 characters').max(500),
});

const verifyKycSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'action must be APPROVE or REJECT' }),
  }),
  note: z.string().min(5).max(500).optional(),
}).refine(
  (data) => data.action === 'APPROVE' || !!data.note,
  { message: 'Rejection note is required when rejecting KYC', path: ['note'] }
);

const updateLoanStatusSchema = z.object({
  status: z.enum([
    'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'DOCUMENTS_VERIFIED',
    'SENT_TO_BANK', 'AWAITING_SANCTION', 'SANCTIONED', 'DISBURSED', 'REJECTED',
  ], { errorMap: () => ({ message: 'Invalid loan status' }) }),
  adminNote: z.string().max(1000).optional(),
});

const changeUserRoleSchema = z.object({
  role: z.enum(['USER', 'PARTNER', 'ADMIN'], {
    errorMap: () => ({ message: 'role must be USER, PARTNER, or ADMIN' }),
  }),
});

const editPropertySchema = z.object({
  title:         z.string().min(5).max(200).optional(),
  description:   z.string().max(5000).optional(),
  price:         z.number().positive().optional(),
  bhk:           z.number().int().min(1).optional(),
  city:          z.string().optional(),
  locality:      z.string().optional(),
  pincode:       z.string().optional(),
  area:          z.number().positive().optional(),
  publishStatus: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED']).optional(),
  rejectionNote: z.string().max(500).optional(),
}).passthrough().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'], {
    errorMap: () => ({ message: 'status must be OPEN, IN_PROGRESS or RESOLVED' }),
  }),
});

module.exports = {
  assignLeadSchema,
  rejectPropertySchema,
  verifyKycSchema,
  updateLoanStatusSchema,
  changeUserRoleSchema,
  editPropertySchema,
  updateTicketSchema,
};
