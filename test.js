// controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper function to generate and set JWT cookie
const setJwtCookie = (res, userId, userRole) => {
    const payload = { user: { id: userId, role: userRole } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5d" });

    // Set the cookie
    res.cookie('token', token, {
        httpOnly: true, // Makes the cookie inaccessible to client-side JavaScript
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
        sameSite: 'Lax', // Or 'Strict' for more security, 'None' if cross-domain (requires secure)
        maxAge: 5 * 24 * 60 * 60 * 1000 // 5 days in milliseconds (matches JWT expiresIn)
    });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        user = new User({ name, email, password, role });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Set JWT as an HTTP-only cookie
        setJwtCookie(res, user.id, user.role);

        res.json({ msg: "Registration successful" }); // No need to send token in JSON response
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

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
        setJwtCookie(res, user.id, user.role);

        res.json({ msg: "Logged in successfully" }); // No need to send token in JSON response
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
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
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};