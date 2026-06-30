const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function getPublicConfig() {
  const entries = await prisma.platformConfig.findMany({
    where: { isPublic: true },
    select: { key: true, value: true },
  });
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
}

// ─── Admin ────────────────────────────────────────────────────────────────────

async function adminListConfig() {
  return prisma.platformConfig.findMany({ orderBy: { key: 'asc' } });
}

async function adminUpsertConfig(key, { value, description, isPublic }, adminId) {
  return prisma.platformConfig.upsert({
    where:  { key },
    create: { key, value, description, isPublic: isPublic ?? false, updatedByAdminId: adminId },
    update: {
      value,
      ...(description !== undefined && { description }),
      ...(isPublic    !== undefined && { isPublic }),
      updatedByAdminId: adminId,
    },
  });
}

async function adminDeleteConfig(key) {
  const entry = await prisma.platformConfig.findUnique({ where: { key } });
  if (!entry) throw new ApiError(404, `Config key "${key}" not found`);
  return prisma.platformConfig.delete({ where: { key } });
}

module.exports = { getPublicConfig, adminListConfig, adminUpsertConfig, adminDeleteConfig };
