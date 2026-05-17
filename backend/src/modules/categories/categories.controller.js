const service = require('./categories.service');

exports.listCategories = async (req, res) => {
  try {
    const categories = await service.findAll();
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};
