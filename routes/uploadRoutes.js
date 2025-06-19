const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadProfileImage, uploadEventImages } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: API for uploading images (profiles, events)
 */

/**
 * @swagger
 * /upload/profile:
 *   post:
 *     summary: Upload a single profile image
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the user's profile. Max 10MB.
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   example: /uploads/profiles/profile-user123-16788888888.webp
 *       400:
 *         description: No file uploaded or invalid file type/size
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error during upload or processing
 */
router.post('/profile', auth, upload.single('profileImage'), uploadProfileImage);

/**
 * @swagger
 * /upload/event:
 *   post:
 *     summary: Upload multiple images for an event
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               eventImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of image files for an event. Max 10MB per file, max 4K resolution.
 *     responses:
 *       200:
 *         description: Event images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: uri
 *                     example: /uploads/events/event-16788888888-image1.webp
 *       400:
 *         description: No files uploaded or invalid file types/sizes
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error during upload or processing
 */
router.post('/event', auth, upload.array('eventImages', 5), uploadEventImages);

module.exports = router;
