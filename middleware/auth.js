// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // Get token from cookie
    const token = req.cookies.token;
    console.log('Backend Auth Middleware: Received token cookie:', token); // <-- Add this

    // Check if not token
    if (!token) {
        console.log('Backend Auth Middleware: No token found in cookie.'); // <-- Add this
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Backend Auth Middleware: Decoded token payload:', decoded.user); // <-- Add this
        req.user = decoded.user; // This should populate { id: '...', role: 'admin' }
        next();
    } catch (err) {
        console.error('Backend Auth Middleware: Token verification failed:', err.message); // <-- Add this
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = auth;