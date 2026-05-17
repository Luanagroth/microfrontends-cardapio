const path = require('path');
const service = require('./curriculums.service');
const { resolveErrorStatus } = require('../../utils/httpErrors');

exports.createCurriculum = async (req, res) => {
  try {
    const { nome, telefone, email, mensagem } = req.body;
    if (!nome || !telefone || !email) {
      return res.status(400).json({ error: 'Nome, telefone e email sao obrigatorios' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Curriculo em PDF e obrigatorio' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const created = await service.create({
      nome,
      telefone,
      email,
      mensagem,
      fileName: req.file.filename,
      originalName: req.file.originalname || path.basename(req.file.filename),
      fileUrl: `${baseUrl}/uploads/curriculums/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message || 'Erro ao enviar curriculo' });
  }
};

exports.listCurriculums = async (req, res) => {
  try {
    const items = await service.findAll();
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateCurriculumStatus = async (req, res) => {
  try {
    const updated = await service.updateStatus(Number(req.params.id), req.body.status);
    return res.json(updated);
  } catch (err) {
    const statusCode = resolveErrorStatus(err, 500);
    if (statusCode >= 500) console.error(err);
    return res.status(statusCode).json({ error: err.message || 'Erro ao atualizar curriculo' });
  }
};
