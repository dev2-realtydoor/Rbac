const prisma = require('./prisma');

async function createAuditLog({ adminId, action, targetType, targetId, before, after, ipAddress }) {
  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      ipAddress: ipAddress || null,
    },
  });
}

module.exports = { createAuditLog };
