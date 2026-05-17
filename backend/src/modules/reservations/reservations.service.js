const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.create = async (payload) => {
  // Expect payload: { nome, telefone, email, date, pessoas, observacao }
  const data = {
    nome: payload.nome,
    telefone: payload.telefone,
    email: payload.email,
    date: new Date(payload.date),
    pessoas: Number(payload.pessoas),
    observacao: payload.observacao || undefined
  };

  const created = await prisma.reservation.create({ data });
  return created;
};

exports.findAll = async ({ status, limit = 50, offset = 0 }) => {
  const where = {};
  if (status) where.status = status;
  const items = await prisma.reservation.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: 'desc' } });
  return items;
};

exports.updateStatus = async (id, status) => {
  const allowed = ['PENDENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];
  if (!allowed.includes(status)) throw new Error('Status inválido');
  const updated = await prisma.reservation.update({ where: { id }, data: { status } });
  return updated;
};
