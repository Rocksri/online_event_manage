const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');

router.post('/', auth, ticketController.createTicket);
router.post('/purchase', auth, ticketController.purchaseTickets);
router.post('/confirm', auth, ticketController.confirmPayment);
router.get('/orders', auth, ticketController.getUserOrders);

module.exports = router;