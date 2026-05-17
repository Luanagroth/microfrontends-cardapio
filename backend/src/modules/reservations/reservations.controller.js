const service = require('./reservations.service');
const { resolveErrorStatus } = require('../../utils/httpErrors');

// POST /api/reservations
exports.createReservation = async (req, res) => {
  try {
    const payload = req.body;
    // Basic validation (expand with validators later)
    if (!payload.nome || !payload.telefone || !payload.email || !payload.date || !payload.pessoas) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const created = await service.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// GET /api/reservations
exports.listReservations = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const result = await service.findAll({ status, limit: Number(limit), offset: Number(offset) });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// PATCH /api/reservations/:id/status
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const updated = await service.updateStatus(Number(id), status);
    return res.json(updated);
  } catch (err) {
    const statusCode = resolveErrorStatus(err, 500);
    if (statusCode >= 500) console.error(err);
    return res.status(statusCode).json({ error: err.message || 'Erro interno' });
  }
};
