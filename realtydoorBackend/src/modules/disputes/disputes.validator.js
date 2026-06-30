const { z } = require('zod');
const { objectId } = require('../../utils/validators');

const DISPUTE_TYPES = ['LEAD', 'ESCROW', 'SERVICE'];

const raiseDisputeSchema = z.object({
  type:        z.enum(DISPUTE_TYPES, {
    errorMap: () => ({ message: `type must be one of: ${DISPUTE_TYPES.join(', ')}` }),
  }),
  referenceId: objectId,
  reason:      z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
});

const resolveDisputeSchema = z.object({
  status:    z.enum(['UNDER_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  adminNote: z.string().min(5).max(1000).optional(),
}).refine(
  (d) => d.status !== undefined || d.adminNote !== undefined,
  { message: 'At least one of status or adminNote must be provided' },
);

module.exports = { raiseDisputeSchema, resolveDisputeSchema };
