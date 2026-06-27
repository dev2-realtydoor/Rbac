const { z } = require('zod');
const { indianPhone, objectId } = require('../../utils/validators');

const submitLeadSchema = z.object({
  propertyId:   objectId,
  buyerName:    z.string().min(2).max(100),
  buyerEmail:   z.string().email(),
  buyerPhone:   indianPhone,
  buyerMessage: z.string().max(500).optional(),
});

const scheduleVisitSchema = z.object({
  scheduledAt: z.string().datetime().refine(
    (d) => new Date(d) > new Date(),
    { message: 'Visit must be scheduled in the future' }
  ),
});

const verifyOtpSchema = z.object({
  otp: z.string().length(4),
});

const uploadDocsSchema = z.object({
  visitNotes: z.string().max(1000).optional(),
  partnerNotes: z.string().max(1000).optional(),
});

const requestDropSchema = z.object({
  reason: z.string().min(5, 'Please provide a meaningful reason (min 5 characters)').max(500),
});

module.exports = { submitLeadSchema, scheduleVisitSchema, verifyOtpSchema, uploadDocsSchema, requestDropSchema };
