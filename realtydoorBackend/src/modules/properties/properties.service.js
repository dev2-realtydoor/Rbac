const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');
const { paginate } = require('../../utils/pagination');

const SORT_MAP = {
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  newest: { createdAt: 'desc' },
  area_asc: { carpetArea: 'asc' },
};

async function searchProperties(query, skip, limit, page) {
  const where = {
    publishStatus: 'APPROVED',
    isB2BOnly: false,
  };

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { locality: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
  if (query.locality) where.locality = { contains: query.locality, mode: 'insensitive' };
  if (query.propertyType) where.propertyType = query.propertyType;
  if (query.listingType) where.listingType = query.listingType;
  if (query.bhk) where.bhk = Number(query.bhk);
  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price.gte = Number(query.minPrice);
    if (query.maxPrice) where.price.lte = Number(query.maxPrice);
  }
  if (query.minArea || query.maxArea) {
    where.carpetArea = {};
    if (query.minArea) where.carpetArea.gte = Number(query.minArea);
    if (query.maxArea) where.carpetArea.lte = Number(query.maxArea);
  }
  if (query.furnishing) where.furnishing = query.furnishing;
  if (query.propertyStatus) where.propertyStatus = query.propertyStatus;
  if (query.isVerified !== undefined) where.isVerified = query.isVerified;
  if (query.amenities) {
    where.amenities = { hasEvery: query.amenities.split(',').map((a) => a.trim()) };
  }

  const orderBy = SORT_MAP[query.sort] || { createdAt: 'desc' };

  const [data, total] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true, title: true, slug: true, price: true, monthlyRent: true,
        propertyType: true, listingType: true, propertyStatus: true,
        bhk: true, carpetArea: true, locality: true, city: true,
        images: true, coverImageIndex: true, isVerified: true, isFeatured: true,
        reraNumber: true, createdAt: true,
      },
    }),
    prisma.property.count({ where }),
  ]);

  return paginate(data, total, page, limit);
}

async function getPropertyBySlug(slug) {
  const property = await prisma.property.findUnique({
    where: { slug, publishStatus: 'APPROVED' },
    include: { partner: { select: { companyName: true, partnerSubType: true } } },
  });
  if (!property) throw new ApiError(404, 'Property not found');
  return property;
}

async function createProperty(data, partnerId) {
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();

  return prisma.property.create({
    data: { ...data, slug, partnerId, publishStatus: 'PENDING_APPROVAL' },
  });
}

async function updateProperty(id, partnerId, data) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new ApiError(404, 'Property not found');
  if (property.partnerId !== partnerId) throw new ApiError(403, 'Not your listing');

  const FORBIDDEN = ['publishStatus', 'isVerified', 'partnerId'];
  FORBIDDEN.forEach((f) => delete data[f]);

  return prisma.property.update({ where: { id }, data });
}

async function getFeaturedProperties() {
  return prisma.property.findMany({
    where: { publishStatus: 'APPROVED', isFeatured: true },
    take: 12,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, price: true, monthlyRent: true,
      propertyType: true, listingType: true, bhk: true, locality: true, city: true,
      images: true, coverImageIndex: true, isVerified: true,
    },
  });
}

async function addImages(id, partnerId, urls) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new ApiError(404, 'Property not found');
  if (property.partnerId !== partnerId) throw new ApiError(403, 'Not your listing');
  return prisma.property.update({
    where: { id },
    data: { images: { push: urls } },
  });
}

async function addVideos(id, partnerId, urls) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new ApiError(404, 'Property not found');
  if (property.partnerId !== partnerId) throw new ApiError(403, 'Not your listing');
  return prisma.property.update({
    where: { id },
    data: { videos: { push: urls } },
  });
}

module.exports = { searchProperties, getPropertyBySlug, createProperty, updateProperty, getFeaturedProperties, addImages, addVideos };
