const express = require('express');
const router = express.Router();
const controller = require('./products.controller');

router.post('/', controller.createProduct);
router.get('/', controller.listProducts);
router.put('/:id', controller.updateProduct);
router.patch('/:id/availability', controller.updateProductAvailability);
router.delete('/:id', controller.deleteProduct);

module.exports = router;
