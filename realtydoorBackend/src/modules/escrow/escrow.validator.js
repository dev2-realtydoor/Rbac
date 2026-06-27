const { z } = require('zod');
const { objectId } = require('../../utils/validators');

const createOrderSchema = z.object({
  leadId: objectId,
  amount: z.number({
    required_error: 'amount is required',
    invalid_type_error: 'amount must be a number',
  }).positive('amount must be a positive number').min(1, 'Minimum escrow amount is ₹1'),
});

const releaseEscrowSchema = z.object({
  sellerAccountId: z.string().min(1).optional(),
  partnerShare:    z.number().positive().optional(),
  platformFee:     z.number().positive().optional(),
  note:            z.string().max(500).optional(),
});

module.exports = { createOrderSchema, releaseEscrowSchema };
