// models/Schedule.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        unique: true // Ensure only one schedule per event
    },
    sessions: [{
        title: { type: String, required: true },
        description: String,
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        speaker: String,
        location: String
    }],
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);