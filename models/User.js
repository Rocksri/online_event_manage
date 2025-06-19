// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['attendee', 'organizer', 'admin'],
        default: 'attendee'
    },
    address: { // New field
        fullAddress: { type: String },
        zip: { type: String }
    },
    dob: { type: Date }, // New field
    phone: { type: String }, // New field
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);