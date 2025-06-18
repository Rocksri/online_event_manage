// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // Your existing authentication middleware
const admin = require('../middleware/admin'); // Your existing authentication middleware

// @route   GET api/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/', auth, admin, userController.getUsers);

// @route   GET api/users/:id
// @desc    Get user by ID (Admin or User themselves)
// @access  Private
router.get('/:id', auth, userController.getUserById);

// @route   PUT api/users/:id
// @desc    Update user profile (Admin or User themselves)
// @access  Private
router.put('/:id', auth, userController.updateUser);

// @route   DELETE api/users/:id
// @desc    Delete user (Admin only)
// @access  Private
router.delete('/:id', auth, admin, userController.deleteUser);


module.exports = router;