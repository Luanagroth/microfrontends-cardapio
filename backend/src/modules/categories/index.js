const express = require('express');
const router = express.Router();
const controller = require('./categories.controller');

router.get('/', controller.listCategories);

module.exports = router;
