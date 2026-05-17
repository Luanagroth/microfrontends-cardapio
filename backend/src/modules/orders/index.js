const express = require('express');
const router = express.Router();
const controller = require('./orders.controller');

router.get('/', controller.listOrders);
router.post('/', controller.createOrder);
router.get('/:id', controller.getOrder);
router.put('/:id', controller.updateOrder);
router.patch('/:id/status', controller.updateOrderStatus);
router.delete('/:id', controller.deleteOrder);

module.exports = router;
