const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');
const { createNotification } = require('../../lib/notifications');

async function submitKyc(partnerId, documentUrls) {
  const user = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!user) throw new ApiError(404, 'User not found');
  if (user.kycStatus === 'VERIFIED') throw new ApiError(400, 'KYC already verified');

  const updated = await prisma.user.update({
    where: { id: partnerId },
    data: { kycStatus: 'PENDING_REVIEW', kycDocumentUrls: documentUrls },
  });

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      title: 'New KYC Pending Review',
      message: `Partner ${user.name} submitted KYC documents.`,
      type: 'KYC_PENDING',
      linkUrl: `/admin/kyc`,
    });
  }

  return updated;
}

async function getProfile(partnerId) {
  return prisma.user.findUnique({
    where: { id: partnerId },
    select: {
      id: true, name: true, email: true, phone: true, companyName: true,
      bio: true, profileImageUrl: true, websiteUrl: true, partnerSubType: true,
      kycStatus: true, kycRejectionNote: true, kycVerifiedAt: true, createdAt: true,
    },
  });
}

async function updateProfile(partnerId, data) {
  const FORBIDDEN = ['role', 'kycStatus', 'kycDocumentUrls', 'email'];
  FORBIDDEN.forEach((f) => delete data[f]);
  return prisma.user.update({ where: { id: partnerId }, data });
}

async function getListing(partnerId, id) {
  const property = await prisma.property.findFirst({ where: { id, partnerId } });
  if (!property) throw new ApiError(404, 'Listing not found');
  return property;
}

async function getMyListings(partnerId, status) {
  const where = { partnerId };
  if (status) where.publishStatus = status;
  return prisma.property.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, publishStatus: true, rejectionNote: true,
      propertyType: true, listingType: true, city: true, locality: true,
      price: true, bhk: true, images: true, createdAt: true,
    },
  });
}

async function getFinanceSummary(partnerId) {
  const leads = await prisma.lead.findMany({
    where: { assignedPartnerId: partnerId },
    include: { escrowTransactions: true },
  });
  const closed = leads.filter((l) => l.status === 'CLOSED');
  const escrowHeld = closed
    .flatMap((l) => l.escrowTransactions)
    .filter((e) => e.status === 'HELD')
    .reduce((sum, e) => sum + e.amount, 0);

  return {
    totalLeads: leads.length,
    closedDeals: closed.length,
    escrowHeld,
  };
}

module.exports = { submitKyc, getProfile, updateProfile, getListing, getMyListings, getFinanceSummary };
