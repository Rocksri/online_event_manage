const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

router.post('/', auth, scheduleController.updateSchedule);
router.get('/:eventId', scheduleController.getSchedule);

module.exports = router;