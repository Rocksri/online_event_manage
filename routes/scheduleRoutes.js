const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Event schedule management
 */

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Create or update event schedule
 *     tags: [Schedules]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 */
router.post('/', auth, scheduleController.updateSchedule);

/**
 * @swagger
 * /schedules/{eventId}:
 *   get:
 *     summary: Get event schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event schedule
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Schedule not found
 */
router.get('/:eventId', scheduleController.getSchedule);

module.exports = router;