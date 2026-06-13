const { PrismaClient } = require('@prisma/client');

const logLevels = ['warn', 'error'];
if (process.env.PRISMA_QUERY_LOG === 'true') logLevels.push('query');

const prisma = global.__prisma ?? new PrismaClient({ log: logLevels });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;
