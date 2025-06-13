const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

router.get('/events/:eventId', auth, analyticsController.getEventAnalytics);
router.get('/organizer', auth, analyticsController.getOrganizerAnalytics);

module.exports = router;