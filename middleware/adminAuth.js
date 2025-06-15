// middleware/adminAuth.js (create this file)
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import your User model

const adminAuth = async (req, res, next) => {
    // 1. Check for token (same as your general auth middleware)
    const token = req.header('x-auth-token') ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // This contains { id: userId }

        // 2. Fetch the user from the database to check their role
        const user = await User.findById(req.user.id).select('role'); // Only fetch the role

        if (!user) {
            return res.status(401).json({ msg: 'User not found, authorization denied' });
        }

        // 3. Check if the user has the 'admin' role
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admin role required' });
        }

        next(); // If admin, proceed to the next middleware/route handler
    } catch (err) {
        console.error('Admin Auth Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = adminAuth;