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

module.exports = { updateProfileSchema };
