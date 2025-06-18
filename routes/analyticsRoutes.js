const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const adminAuth = require('../middleware/admin')

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

/**
 * @swagger
 * /analytics/admin:
 *   get:
 *     summary: Get admin analytics
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: Time range for analytics
 *     responses:
 *       200:
 *         description: Admin analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 totalUsers:
 *                   type: integer
 *                 eventsOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 revenueOverTime:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       period:
 *                         type: string
 *                       amount:
 *                         type: number
 *                 topCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 attendeeCount:
 *                   type: integer
 *                 organizerCount:
 *                   type: integer
 *                 adminCount:
 *                   type: integer
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Server error
 */
router.get('/admin', auth, adminAuth, analyticsController.getAdminAnalytics);

module.exports = router;