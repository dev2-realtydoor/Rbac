const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function getLocality(city, locality) {
  const insight = await prisma.localityInsight.findFirst({
    where: {
      city:     { equals: city,     mode: 'insensitive' },
      locality: { equals: locality, mode: 'insensitive' },
    },
  });
  if (!insight) throw new ApiError(404, 'No locality data found');
  return insight;
}

async function upsertLocality(data, adminId) {
  const { city, locality, ...rest } = data;
  return prisma.localityInsight.upsert({
    where:  { city_locality: { city, locality } },
    update: { ...rest, updatedByAdminId: adminId },
    create: { city, locality, ...rest, updatedByAdminId: adminId },
  });
}

async function listLocalities({ city } = {}, skip = 0, limit = 20) {
  const where = {};
  if (city) where.city = { equals: city, mode: 'insensitive' };

  const [data, total] = await prisma.$transaction([
    prisma.localityInsight.findMany({ where, skip, take: limit, orderBy: { city: 'asc' } }),
    prisma.localityInsight.count({ where }),
  ]);
  return { data, total };
}

async function getLocalityById(id) {
  const insight = await prisma.localityInsight.findUnique({ where: { id } });
  if (!insight) throw new ApiError(404, 'Locality insight not found');
  return insight;
}

async function deleteLocality(id) {
  const insight = await prisma.localityInsight.findUnique({ where: { id } });
  if (!insight) throw new ApiError(404, 'Locality insight not found');
  return prisma.localityInsight.delete({ where: { id } });
}

module.exports = { getLocality, listLocalities, getLocalityById, upsertLocality, deleteLocality };
