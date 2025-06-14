const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ticketController = require('../controllers/ticketController');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket purchasing and management
 */

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a new ticket type
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: 5f8d0d55b54764421b7156c4
 *               name:
 *                 type: string
 *                 example: VIP Pass
 *               type:
 *                 type: string
 *                 enum: [general, vip, premium, student]
 *                 example: vip
 *               price:
 *                 type: number
 *                 example: 199.99
 *               quantity:
 *                 type: integer
 *                 example: 100
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-09-01T00:00:00Z'
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-10-14T23:59:59Z'
 *     responses:
 *       201:
 *         description: Ticket type created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Bad request
 */
router.post('/', auth, ticketController.createTicket);

/**
 * @swagger
 * /tickets/purchase:
 *   post:
 *     summary: Initiate ticket purchase
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 5f8d0d55b54764421b7156c4
 *               tickets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: string
 *                       example: 5f8d0d55b54764421b7156c5
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   example: pi_3KtX4k2eZvKYlo2C0XrY7Lb0_secret_abc123
 *                 totalAmount:
 *                   type: number
 *                   example: 399.98
 *       400:
 *         description: Bad request
 */
router.post('/purchase', auth, ticketController.purchaseTickets);

/**
 * @swagger
 * /tickets/confirm:
 *   post:
 *     summary: Confirm payment and create order
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *                 example: pi_3KtX4k2eZvKYlo2C0XrY7Lb0
 *               eventId:
 *                 type: string
 *                 example: 5f8d0d55b54764421b7156c4
 *               tickets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketId:
 *                       type: string
 *                       example: 5f8d0d55b54764421b7156c5
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       200:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request
 */
router.post('/confirm', auth, ticketController.confirmPayment);

/**
 * @swagger
 * /tickets/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Tickets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
router.get('/orders', auth, ticketController.getUserOrders);


router.get('/event/:eventId', ticketController.getTicketsByEvent);

module.exports = router;