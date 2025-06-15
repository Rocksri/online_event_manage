// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your general auth middleware
const adminAuth = require('../middleware/adminAuth'); // The new admin role check middleware
const userController = require('../controllers/userController'); // Your new user controller

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', auth, adminAuth, userController.getAllUsers);

module.exports = router;