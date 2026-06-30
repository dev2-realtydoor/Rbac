const { z } = require('zod');

const upsertConfigSchema = z.object({
  value:       z.string().min(1).max(5000),
  description: z.string().max(500).optional(),
  isPublic:    z.boolean().optional(),
});

module.exports = { upsertConfigSchema };
