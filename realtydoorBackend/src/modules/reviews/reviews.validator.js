const { z } = require('zod');
const { objectId } = require('../../utils/validators');

const postReviewSchema = z.object({
  propertyId: objectId,
  rating:     z.number().int().min(1).max(5),
  title:      z.string().min(3).max(150).optional(),
  body:       z.string().min(10).max(3000).optional(),
});

const moderateReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'action must be APPROVE or REJECT' }),
  }),
});

module.exports = { postReviewSchema, moderateReviewSchema };
