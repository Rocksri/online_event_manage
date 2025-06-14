const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Event analytics and reporting
 */

/**
 * @swagger
 * /analytics/events/{eventId}:
 *   get:
 *     summary: Get event analytics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   type: string
 *                   example: Tech Conference 2023
 *                 totalSales:
 *                   type: number
 *                   example: 15000
 *                 ticketsSold:
 *                   type: integer
 *                   example: 150
 *                 ticketSales:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: VIP Pass
 *                       type:
 *                         type: string
 *                         example: vip
 *                       price:
 *                         type: number
 *                         example: 199.99
 *                       available:
 *                         type: integer
 *                         example: 50
 *                       sold:
 *                         type: integer
 *                         example: 50
 *                       revenue:
 *                         type: number
 *                         example: 9999.5
 *                 attendanceRate:
 *                   type: string
 *                   example: 85.71%
 *       401:
 *         description: Unauthorized
 */
router.get('/events/:eventId', auth, analyticsController.getEventAnalytics);

/**
 * @swagger
 * /analytics/organizer:
 *   get:
 *     summary: Get organizer analytics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Organizer analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                   example: 5
 *                 totalRevenue:
 *                   type: number
 *                   example: 25000
 *                 totalAttendees:
 *                   type: integer
 *                   example: 350
 *                 avgRevenuePerEvent:
 *                   type: number
 *                   example: 5000
 *       401:
 *         description: Unauthorized
 */
router.get('/organizer', auth, analyticsController.getOrganizerAnalytics);

module.exports = router;