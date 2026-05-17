const service = require('./products.service');

exports.createProduct = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.name || !payload.price || !payload.categoryId) {
      return res.status(400).json({ error: 'name, price e categoryId são obrigatórios' });
    }
    const created = await service.create(payload);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.listProducts = async (req, res) => {
  try {
    const products = await service.findAll();
    return res.json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await service.update(Number(id), payload);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateProductAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    if (available === undefined) {
      return res.status(400).json({ error: 'available é obrigatório' });
    }
    const updated = await service.updateAvailability(Number(id), Boolean(available));
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await service.remove(Number(id));
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};
