// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper function to generate and set JWT cookie
const setJwtCookie = (res, userId, userRole) => {
    const payload = { user: { id: userId, role: userRole } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5d" });

    // Determine if secure cookie is needed (true in production/HTTPS, false in development/HTTP)
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
        httpOnly: true,
        // 'secure' must be true for cross-site cookies over HTTPS. False for local HTTP.
        secure: isProduction,
        // 'sameSite' must be 'None' for cross-site cookies.
        // Requires 'secure: true' when 'SameSite' is 'None'.
        // For local development (HTTP), 'Lax' is a safer default.
        sameSite: isProduction ? 'None' : 'Lax',
        maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days in milliseconds
    });
};
// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    // Add new fields to destructuring
    const { name, email, password, role, address, dob, phone } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        // Include new fields when creating a new User
        user = new User({ name, email, password, role, address, dob, phone });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Set JWT as an HTTP-only cookie
        console.log("Attempting to set JWT cookie for user:", user.id);
        setJwtCookie(res, user.id, user.role);
        console.log("JWT cookie setting function called successfully.");

        res.status(201).json({ msg: "User registered successfully" }); // or Logged in successfully
    } catch (err) {
        console.error("Error in authController (register/login):", err); // Catch specific errors here
        res.status(500).send("Server error: " + err.message); // Send more specific error message
    }
}

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Set JWT as an HTTP-only cookie
        console.log("Attempting to set JWT cookie for user:", user.id);
        setJwtCookie(res, user.id, user.role);
        console.log("JWT cookie setting function called successfully.");

        res.status(201).json({ msg: "User registered successfully" }); // or Logged in successfully
    } catch (err) {
        console.error("Error in authController (register/login):", err); // Catch specific errors here
        res.status(500).send("Server error: " + err.message); // Send more specific error message
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
    try {
        // Clear the 'token' cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax'
        });
        res.json({ msg: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).send("Server error");
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware if a valid token is present in cookies
        // Populate all necessary fields for the profile page
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};



// controllers/authController.js - Add this new function
// @desc    Generate new password for user
// @route   POST /api/auth/generate-password
exports.generatePassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        // Generate random password (8 characters)
        const newPassword = Math.random().toString(36).slice(-8);

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Return new password (in development only)
        if (process.env.NODE_ENV === 'development') {
            res.json({
                msg: "Password updated successfully",
                newPassword
            });
        } else {
            // In production, we would send email here
            res.json({
                msg: "Password updated. Check your email for new password."
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};