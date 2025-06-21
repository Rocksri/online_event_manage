const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // We'll create this next

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, role, address, dob, phone } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
            role,
            address,
            dob,
            phone
        });

        // Hash password (handled in User model pre-save hook)
        await user.save();

        // Generate token and send it via cookie
        sendTokenResponse(user, 201, res);

    } catch (err) {
        console.error(err.message);
        // Check for duplicate key error (e.g., duplicate email)
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Duplicate field value entered' });
        }
        res.status(500).send('Server error');
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter an email and password' });
    }

    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'Strict' // Protect against CSRF
    });
    res.status(200).json({ msg: 'Logged out successfully' });
};


// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false }); // Save user with token without re-validating other fields

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email and your password will remain unchanged. This link will expire in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Token',
                message
            });

            res.status(200).json({ success: true, msg: 'Email sent' });

        } catch (err) {
            console.error('Error sending email:', err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false }); // Clear token if email fails

            return res.status(500).json({ msg: 'Email could not be sent' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res) => {
    // Get hashed token from URL params
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // Check if token is not expired
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        // Set new password
        user.password = req.body.password; // Mongoose pre-save hook will hash this
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save(); // Save the new password and clear token fields

        sendTokenResponse(user, 200, res); // Log user in after password reset

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update user password (authenticated user)
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.id).select('+password');

        // Check if current password matches
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ msg: 'Current password is incorrect' });
        }

        user.password = newPassword; // Mongoose pre-save hook will hash this
        await user.save();

        sendTokenResponse(user, 200, res);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // Convert days to milliseconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Send cookie only over HTTPS in production
        sameSite: 'Strict' // Protect against CSRF
    };

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};
