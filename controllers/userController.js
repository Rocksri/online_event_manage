// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
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
// @access  Private/Admin or User itself
exports.updateUserProfile = async (req, res) => {
    const { name, email, password, role, address, dob, phone } = req.body; // Destructure all possible fields

    // Build userFields object
    const userFields = {};
    if (name) userFields.name = name;
    if (email) userFields.email = email;
    if (address) userFields.address = address; // Assuming address is an object or handled correctly
    if (dob) userFields.dob = dob;
    if (phone) userFields.phone = phone;

    // Handle password update (only if provided and hashed) - typically done in authController or a dedicated route
    if (password) {
        // You would typically hash the password here before saving
        // userFields.password = await bcrypt.hash(password, 10);
        return res.status(400).json({ msg: 'Password updates should be done via a dedicated password change route.' });
    }

    // IMPORTANT: Handle role update ONLY if the requesting user is an admin
    if (role && req.user && req.user.role === 'admin') {
        // Validate the role value against allowed roles
        const allowedRoles = ['attendee', 'organizer', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified.' });
        }
        userFields.role = role;
    } else if (role && req.user && req.user.role !== 'admin') {
        // Prevent non-admin users from trying to change their role
        return res.status(403).json({ msg: 'Not authorized to change user role.' });
    }


    try {
        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check if the requesting user is trying to update their own profile
        // or if they are an admin updating another user's profile
        if (user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to update this user profile' });
        }

        // Perform the update
        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields }, // Use $set to update only specified fields
            { new: true, runValidators: true } // new: true returns the updated doc; runValidators ensures schema validation
        ).select('-password'); // Exclude password from the returned document

        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        // Handle potential validation errors from Mongoose
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
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
            // For now, let's prevent self-deletion for simplicity
            return res.status(403).json({ msg: 'Admins cannot delete their own account via this route.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        res.status(500).send('Server error');
    }
};