const service = require('./orders.service');
const { resolveErrorStatus } = require('../../utils/httpErrors');

exports.listOrders = async (req, res) => {
  try {
    const orders = await service.findAll();
    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await service.findById(Number(req.params.id));
    if (!order) return res.status(404).json({ error: 'Comanda não encontrada' });
    return res.json(order);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    if (!req.body.tableNumber && !req.body.mesa) {
      return res.status(400).json({ error: 'Número da mesa é obrigatório' });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ error: 'A comanda precisa ter pelo menos um item' });
    }
    const created = await service.create(req.body);
    return res.status(201).json(created);
  } catch (err) {
    const statusCode = resolveErrorStatus(err, 500);
    if (statusCode >= 500) console.error(err);
    return res.status(statusCode).json({ error: err.message || 'Erro ao criar comanda' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const updated = await service.update(Number(req.params.id), req.body);
    return res.json(updated);
  } catch (err) {
    const statusCode = resolveErrorStatus(err, 500);
    if (statusCode >= 500) console.error(err);
    return res.status(statusCode).json({ error: err.message || 'Erro ao atualizar comanda' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });
    const updated = await service.updateStatus(Number(req.params.id), status);
    return res.json(updated);
  } catch (err) {
    const statusCode = resolveErrorStatus(err, 500);
    if (statusCode >= 500) console.error(err);
    return res.status(statusCode).json({ error: err.message || 'Erro ao atualizar status' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    await service.remove(Number(req.params.id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};
