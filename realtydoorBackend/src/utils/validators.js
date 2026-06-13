const { z } = require('zod');

const indianPhone = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Must be a valid Indian mobile number (+91XXXXXXXXXX)');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID');

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

module.exports = { indianPhone, objectId, paginationSchema };
