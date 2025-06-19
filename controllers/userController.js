// controllers/userController.js
const User = require('../models/User'); // Assuming you have a User model
const bcrypt = require('bcryptjs'); // Needed for password hashing if we handle it here, but we will use authController

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        // Fetch all users, but don't send their passwords
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get user by ID (for profile management)
// @route   GET /api/users/:id
// @access  Private/Admin or User itself
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Allow user to get their own profile, or admin to get any profile
        if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to view this user profile' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).send('Server error');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private/Admin or User themselves
exports.updateUser = async (req, res) => {
    // Include new fields for update
    const { name, email, address, dob, phone } = req.body;

    // Build user object
    const userFields = {};
    if (name) userFields.name = name;
    // Email is typically not changed via a simple profile update, but if allowed,
    // ensure unique validation is handled at the model level or here.
    // For now, we'll keep it as potentially updatable but comment on its sensitivity.
    // if (email) userFields.email = email; // Be careful with email updates as they affect login.

    if (address) userFields.address = address; // This will update the entire address object
    if (dob) userFields.dob = dob;
    if (phone) userFields.phone = phone;


    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Ensure user is authorized to update: either their own profile or admin
        if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to update this user profile' });
        }

        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true } // Return the updated document
        ).select('-password'); // Don't send password back

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).send('Server error');
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Prevent admin from deleting themselves if desired, or allow it
        if (req.user.id === req.params.id && req.user.role === 'admin') {
            // You might want to add more sophisticated checks here
            // e.g., ensure there's at least one other admin before allowing self-deletion
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).send('Server error: ' + err.message);
    }
};