const { PrismaClient } = require('@prisma/client');
const { resolveMenuImageUrl } = require('./menuImages');
const prisma = new PrismaClient();

const withResolvedImage = (product) => ({
  ...product,
  imageUrl: resolveMenuImageUrl(product)
});

exports.create = async (payload) => {
  const data = {
    name: payload.name,
    description: payload.description || undefined,
    price: Number(payload.price),
    imageUrl: payload.imageUrl || undefined,
    available: payload.available !== undefined ? Boolean(payload.available) : true,
    categoryId: Number(payload.categoryId)
  };
  return prisma.product.create({ data, include: { category: true } });
};

exports.findAll = async () => {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });
  return products.map(withResolvedImage);
};

exports.update = async (id, payload) => {
  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.price !== undefined) data.price = Number(payload.price);
  if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl;
  if (payload.available !== undefined) data.available = Boolean(payload.available);
  if (payload.categoryId !== undefined) data.categoryId = Number(payload.categoryId);

  return prisma.product.update({ where: { id }, data, include: { category: true } });
};

exports.updateAvailability = async (id, available) => {
  return prisma.product.update({
    where: { id },
    data: { available },
    include: { category: true }
  });
};

exports.remove = async (id) => {
  return prisma.product.delete({ where: { id } });
};
