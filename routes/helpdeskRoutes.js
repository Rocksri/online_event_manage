const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const controller = require('../controllers/helpdeskController');

/**
 * @swagger
 * tags:
 *   name: HelpDesk
 *   description: Support ticket system for attendees, organizers, and admin
 */

/**
 * @swagger
 * /helpdesk:
 *   post:
 *     summary: Submit a helpdesk ticket
 *     tags: [HelpDesk]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Issue with ticket purchase
 *               message:
 *                 type: string
 *                 example: I didn't receive my confirmation email.
 *     responses:
 *       201:
 *         description: Ticket submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized (user not logged in)
 *       500:
 *         description: Server error
 */
router.post('/', auth, controller.submitTicket);

/**
 * @swagger
 * /helpdesk/my:
 *   get:
 *     summary: Get current user's support tickets
 *     tags: [HelpDesk]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized
 */
router.get('/my', auth, controller.getMyTickets);

/**
 * @swagger
 * /helpdesk/all:
 *   get:
 *     summary: Get all submitted tickets (admin only)
 *     tags: [HelpDesk]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all support tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/all', auth, admin, controller.getAllTickets);

/**
 * @swagger
 * /helpdesk/{id}/respond:
 *   put:
 *     summary: Admin responds to a ticket
 *     tags: [HelpDesk]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [response]
 *             properties:
 *               response:
 *                 type: string
 *                 example: We've confirmed your ticket and it is now resolved.
 *     responses:
 *       200:
 *         description: Ticket responded and marked as resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Invalid ticket ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Ticket not found
 */
router.put('/:id/respond', auth, admin, controller.respondToTicket);


module.exports = router;
