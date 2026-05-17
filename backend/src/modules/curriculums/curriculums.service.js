const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALLOWED_STATUS = ['NOVO', 'EM_ANALISE', 'APROVADO', 'RECUSADO'];

exports.create = async (payload) => {
  return prisma.curriculum.create({
    data: {
      nome: payload.nome,
      telefone: payload.telefone,
      email: payload.email,
      mensagem: payload.mensagem || null,
      fileName: payload.fileName,
      originalName: payload.originalName,
      fileUrl: payload.fileUrl,
      mimeType: payload.mimeType,
      size: Number(payload.size || 0)
    }
  });
};

exports.findAll = async () => {
  return prisma.curriculum.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

exports.updateStatus = async (id, status) => {
  if (!ALLOWED_STATUS.includes(status)) {
    throw new Error('Status invalido');
  }

  return prisma.curriculum.update({
    where: { id },
    data: { status }
  });
};
