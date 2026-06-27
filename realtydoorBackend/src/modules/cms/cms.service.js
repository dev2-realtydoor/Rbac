const prisma = require('../../lib/prisma');
const ApiError = require('../../utils/ApiError');

async function getPublished(type, skip, limit) {
  const where = { isPublished: true };
  if (type) where.type = type;

  const [data, total] = await prisma.$transaction([
    prisma.contentBlock.findMany({ where, skip, take: limit, orderBy: { publishedAt: 'desc' } }),
    prisma.contentBlock.count({ where }),
  ]);
  return { data, total };
}

async function getBySlug(slug) {
  const block = await prisma.contentBlock.findUnique({ where: { slug, isPublished: true } });
  if (!block) throw new ApiError(404, 'Content not found');
  return block;
}

async function getAllForAdmin(type, skip, limit) {
  const where = {};
  if (type) where.type = type;

  const [data, total] = await prisma.$transaction([
    prisma.contentBlock.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
    prisma.contentBlock.count({ where }),
  ]);
  return { data, total };
}

async function getByIdForAdmin(id) {
  const block = await prisma.contentBlock.findUnique({ where: { id } });
  if (!block) throw new ApiError(404, 'Content block not found');
  return block;
}

async function create(data) {
  const toSave = { ...data };
  if (toSave.isPublished && !toSave.publishedAt) toSave.publishedAt = new Date();
  try {
    return await prisma.contentBlock.create({ data: toSave });
  } catch (err) {
    if (err.code === 'P2002') throw new ApiError(409, 'A content block with that slug already exists');
    throw err;
  }
}

async function update(id, data) {
  const existing = await prisma.contentBlock.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Content block not found');

  const toSave = { ...data };
  if (toSave.isPublished && !toSave.publishedAt && !existing.publishedAt) {
    toSave.publishedAt = new Date();
  }
  return prisma.contentBlock.update({ where: { id }, data: toSave });
}

async function remove(id) {
  const existing = await prisma.contentBlock.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, 'Content block not found');
  return prisma.contentBlock.delete({ where: { id } });
}

module.exports = { getPublished, getBySlug, getAllForAdmin, getByIdForAdmin, create, update, remove };
