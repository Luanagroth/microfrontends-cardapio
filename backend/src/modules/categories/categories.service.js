const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.findAll = async () => {
  return prisma.category.findMany({ orderBy: { label: 'asc' } });
};
