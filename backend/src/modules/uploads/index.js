const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const productsUploadDir = path.join(__dirname, '../../../uploads/products');

fs.mkdirSync(productsUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, productsUploadDir);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const baseName = path
      .basename(file.originalname || 'produto', extension)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    callback(null, `${Date.now()}-${baseName || 'produto'}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new Error('Arquivo deve ser uma imagem'));
    }
    return callback(null, true);
  }
});

router.post('/products', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Imagem é obrigatória' });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return res.status(201).json({
    imageUrl: `${baseUrl}/uploads/products/${req.file.filename}`
  });
});

module.exports = router;
