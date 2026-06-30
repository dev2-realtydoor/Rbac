const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function raiseDispute(userId, { type, referenceId, reason, description }) {
  let owned = false;
  if (type === 'LEAD') {
    owned = !!(await prisma.lead.findFirst({ where: { id: referenceId, buyerId: userId } }));
  } else if (type === 'ESCROW') {
    owned = !!(await prisma.escrowTransaction.findFirst({ where: { id: referenceId, buyerId: userId } }));
  } else if (type === 'SERVICE') {
    owned = !!(await prisma.userSubscription.findFirst({ where: { id: referenceId, userId } }));
  }
  if (!owned) throw new ApiError(404, 'Referenced record not found or does not belong to you');

  const existing = await prisma.dispute.findFirst({
    where: { userId, referenceId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
  });
  if (existing) throw new ApiError(409, 'An active dispute already exists for this record');

  return prisma.dispute.create({ data: { userId, type, referenceId, reason, description } });
}

async function getMyDisputes(userId) {
  return prisma.dispute.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

async function adminListDisputes(filters, skip, limit) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type)   where.type   = filters.type;
  if (filters.userId) where.userId = filters.userId;

  const [data, total] = await Promise.all([
    prisma.dispute.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),
    prisma.dispute.count({ where }),
  ]);
  return { data, total };
}

async function adminResolveDispute(disputeId, { status, adminNote }, adminId) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw new ApiError(404, 'Dispute not found');
  if (dispute.status === 'CLOSED') throw new ApiError(400, 'Dispute is already closed');

  const data = {};
  if (status)    { data.status = status; }
  if (adminNote) { data.adminNote = adminNote; }
  if (status === 'RESOLVED' || status === 'CLOSED') {
    data.resolvedAt = new Date();
    data.resolvedByAdminId = adminId;
  }

  return prisma.dispute.update({ where: { id: disputeId }, data });
}

module.exports = { raiseDispute, getMyDisputes, adminListDisputes, adminResolveDispute };
