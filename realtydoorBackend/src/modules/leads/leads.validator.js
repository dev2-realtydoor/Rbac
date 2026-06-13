const { z } = require('zod');
const { indianPhone } = require('../../utils/validators');

const submitLeadSchema = z.object({
  propertyId: z.string().min(1),
  buyerName: z.string().min(2).max(100),
  buyerEmail: z.string().email(),
  buyerPhone: indianPhone,
  buyerMessage: z.string().max(500).optional(),
});

const scheduleVisitSchema = z.object({
  scheduledAt: z.string().datetime(),
});

const verifyOtpSchema = z.object({
  otp: z.string().length(4),
});

const uploadDocsSchema = z.object({
  visitNotes: z.string().max(1000).optional(),
  partnerNotes: z.string().max(1000).optional(),
});

module.exports = { submitLeadSchema, scheduleVisitSchema, verifyOtpSchema, uploadDocsSchema };
