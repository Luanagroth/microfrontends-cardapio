const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALLOWED_STATUS = ['aberta', 'em preparo', 'entregue', 'fechada', 'cancelada'];

function parseItems(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? { items: parsed, details: {} } : { items: parsed.items || [], details: parsed.details || {} };
  } catch (err) {
    return { items: [], details: {} };
  }
}

function normalizeItems(items = []) {
  return items.map((item) => {
    const price = Number(item.price || 0);
    const quantity = Math.max(1, Number(item.quantity || 1));
    return {
      productId: Number(item.productId),
      name: item.name,
      category: item.category || '',
      imageUrl: item.imageUrl || '',
      price,
      quantity,
      subtotal: Number((price * quantity).toFixed(2))
    };
  });
}

function calculateTotal(items = []) {
  return Number(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0).toFixed(2));
}

function formatOrder(order) {
  const parsed = parseItems(order.items);
  return {
    ...order,
    items: parsed.items,
    details: parsed.details || {}
  };
}

function validateStatus(status) {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new Error('Status inválido');
  }
}

exports.findAll = async () => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return orders.map(formatOrder);
};

exports.findById = async (id) => {
  const order = await prisma.order.findUnique({ where: { id } });
  return order ? formatOrder(order) : null;
};

exports.create = async (payload) => {
  const items = normalizeItems(payload.items || []);
  const status = payload.status || 'aberta';
  validateStatus(status);
  const subtotal = calculateTotal(items);
  const discount = Number(payload.discount || 0);
  const total = Number(Math.max(0, subtotal - discount).toFixed(2));
  const details = {
    subtotal,
    discount,
    total,
    couponCode: payload.couponCode || '',
    couponLabel: payload.couponLabel || '',
    paymentMethod: payload.paymentMethod || '',
    receivedAmount: Number(payload.receivedAmount || 0),
    changeValue: Number(payload.changeValue || 0),
    openedAt: payload.openedAt || null,
    closedAt: payload.closedAt || null
  };

  const order = await prisma.order.create({
    data: {
      tableNumber: String(payload.tableNumber || payload.mesa || ''),
      customerName: payload.customerName || null,
      items: JSON.stringify({ items, details }),
      total,
      status
    }
  });

  return formatOrder(order);
};

exports.update = async (id, payload) => {
  const data = {};

  if (payload.tableNumber !== undefined || payload.mesa !== undefined) {
    data.tableNumber = String(payload.tableNumber || payload.mesa || '');
  }
  if (payload.customerName !== undefined) data.customerName = payload.customerName || null;
  if (payload.items !== undefined) {
    const items = normalizeItems(payload.items);
    const subtotal = calculateTotal(items);
    const discount = Number(payload.discount || 0);
    const total = Number(Math.max(0, subtotal - discount).toFixed(2));
    const details = {
      subtotal,
      discount,
      total,
      couponCode: payload.couponCode || '',
      couponLabel: payload.couponLabel || '',
      paymentMethod: payload.paymentMethod || '',
      receivedAmount: Number(payload.receivedAmount || 0),
      changeValue: Number(payload.changeValue || 0),
      openedAt: payload.openedAt || null,
      closedAt: payload.closedAt || null
    };
    data.items = JSON.stringify({ items, details });
    data.total = total;
  }
  if (payload.status !== undefined) {
    validateStatus(payload.status);
    data.status = payload.status;
  }

  const order = await prisma.order.update({ where: { id }, data });
  return formatOrder(order);
};

exports.updateStatus = async (id, status) => {
  validateStatus(status);
  const order = await prisma.order.update({
    where: { id },
    data: { status }
  });
  return formatOrder(order);
};

exports.remove = async (id) => {
  return prisma.order.delete({ where: { id } });
};
