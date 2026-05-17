const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./curriculums.controller');

const router = express.Router();
const curriculumsUploadDir = path.join(__dirname, '../../../uploads/curriculums');

fs.mkdirSync(curriculumsUploadDir, { recursive: true });

const normalizeFileName = (name = 'curriculo') =>
  path
    .basename(name, path.extname(name))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, curriculumsUploadDir);
  },
  filename: (req, file, callback) => {
    const baseName = normalizeFileName(file.originalname || 'curriculo') || 'curriculo';
    callback(null, `${Date.now()}-${baseName}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'application/pdf') {
      return callback(new Error('Arquivo deve ser PDF'));
    }
    return callback(null, true);
  }
});

router.get('/', controller.listCurriculums);
router.post('/', upload.single('arquivo'), controller.createCurriculum);
router.patch('/:id/status', controller.updateCurriculumStatus);

module.exports = router;
