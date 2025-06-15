// controllers/userController.js (create this file if it doesn't exist)
const User = require('../models/User'); // Import your User model

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        // You can add filtering/pagination here if needed in the future
        const users = await User.find().select('-password'); // Exclude password from the response

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};