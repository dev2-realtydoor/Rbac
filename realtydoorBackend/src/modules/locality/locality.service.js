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

async function getCitiesSummary() {
  const [localities, properties] = await Promise.all([
    prisma.localityInsight.findMany({
      select: { city: true, avgPricePerSqftPaise: true, priceChangeLastMonthPct: true },
    }),
    prisma.property.findMany({
      where: { publishStatus: 'APPROVED' },
      select: { city: true },
    }),
  ]);

  // Aggregate price + trend per city from LocalityInsight rows
  const cityInsights = {};
  localities.forEach(({ city, avgPricePerSqftPaise, priceChangeLastMonthPct }) => {
    if (!cityInsights[city]) cityInsights[city] = { prices: [], trends: [] };
    cityInsights[city].prices.push(avgPricePerSqftPaise);
    if (priceChangeLastMonthPct != null) cityInsights[city].trends.push(priceChangeLastMonthPct);
  });

  // Count live listings per city
  const cityCounts = {};
  properties.forEach(({ city }) => { cityCounts[city] = (cityCounts[city] || 0) + 1; });

  const allCities = new Set([...Object.keys(cityInsights), ...Object.keys(cityCounts)]);
  return [...allCities]
    .map((city) => {
      const { prices = [], trends = [] } = cityInsights[city] || {};
      const avg = prices.length
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null;
      const trend = trends.length
        ? Math.round((trends.reduce((a, b) => a + b, 0) / trends.length) * 10) / 10
        : null;
      return { city, listingsCount: cityCounts[city] || 0, avgPricePerSqftPaise: avg, trendPct: trend };
    })
    .sort((a, b) => b.listingsCount - a.listingsCount);
}

module.exports = { getLocality, listLocalities, getLocalityById, upsertLocality, deleteLocality, getCitiesSummary };
