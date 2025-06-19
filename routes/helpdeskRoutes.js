const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const controller = require('../controllers/helpdeskController');

router.post('/', auth, controller.submitTicket); // attendee or organizer
router.get('/my', auth, controller.getMyTickets); // view own queries
router.get('/all', auth, admin, controller.getAllTickets); // admin
router.put('/:id/respond', auth, admin, controller.respondToTicket); // admin reply

module.exports = router;
