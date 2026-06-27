const { z } = require('zod');

const broadcastSchema = z.object({
  roles: z.array(
    z.enum(['USER', 'PARTNER', 'ADMIN'], { errorMap: () => ({ message: 'Invalid role in roles array' }) })
  ).optional(),
  title: z.string().min(1, 'title is required').max(200),
  message: z.string().min(1, 'message is required').max(1000),
  type: z.string().min(1).max(50).default('ANNOUNCEMENT'),
});

module.exports = { broadcastSchema };
