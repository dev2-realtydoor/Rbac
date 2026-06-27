const { z } = require('zod');

const upsertLocalitySchema = z.object({
  city:             z.string().min(2).max(100),
  locality:         z.string().min(2).max(100),
  avgPricePerSqft:  z.number().positive().optional(),
  appreciation:     z.number().optional(),
  connectivity:     z.string().max(500).optional(),
  amenities:        z.string().max(500).optional(),
  overview:         z.string().max(2000).optional(),
  trending:         z.boolean().optional(),
}).passthrough();

module.exports = { upsertLocalitySchema };
