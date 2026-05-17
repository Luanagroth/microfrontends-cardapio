const express = require('express');
const router = express.Router();

const controller = require('./reservations.controller');

router.post('/', controller.createReservation);
router.get('/', controller.listReservations);
router.patch('/:id/status', controller.updateReservationStatus);

module.exports = router;
