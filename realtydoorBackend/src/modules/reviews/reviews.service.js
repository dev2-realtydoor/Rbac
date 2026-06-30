const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function postReview(userId, { propertyId, rating, title, body }) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, publishStatus: 'APPROVED' },
    select: { id: true },
  });
  if (!property) throw new ApiError(404, 'Property not found');

  const existing = await prisma.propertyReview.findUnique({
    where: { userId_propertyId: { userId, propertyId } },
  });
  if (existing) throw new ApiError(409, 'You have already reviewed this property');

  return prisma.propertyReview.create({
    data: { userId, propertyId, rating, title, body },
  });
}

async function getPropertyReviews(propertyId) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, publishStatus: 'APPROVED' },
    select: { id: true },
  });
  if (!property) throw new ApiError(404, 'Property not found');

  return prisma.propertyReview.findMany({
    where: { propertyId, isApproved: true },
    include: { user: { select: { name: true, profileImageUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

async function adminListReviews(filters, skip, limit) {
  const where = {};
  if (filters.propertyId !== undefined) where.propertyId = filters.propertyId;
  if (filters.isApproved !== undefined) where.isApproved = filters.isApproved === 'true';

  const [data, total] = await Promise.all([
    prisma.propertyReview.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user:     { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.propertyReview.count({ where }),
  ]);
  return { data, total };
}

async function adminModerateReview(reviewId, action, adminId) {
  const review = await prisma.propertyReview.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, 'Review not found');

  const isApprove = action === 'APPROVE';
  return prisma.propertyReview.update({
    where: { id: reviewId },
    data: {
      isApproved:        isApprove,
      moderatedAt:       new Date(),
      moderatedByAdminId: adminId,
    },
  });
}

module.exports = { postReview, getPropertyReviews, adminListReviews, adminModerateReview };
