const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: {
        venue: String,
        address: String,
        city: String,
        country: String
    },
    capacity: Number,
    category: { type: String, required: true },
    images: [{ // To store an array of URLs for event images
        type: String
    }],
    videos: [String],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled'],
        default: 'draft'
    },
    ticketTypes: [{ // Array of ObjectIds referencing the Ticket model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket' // This must match the name of your Ticket model
    }],
    createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Event', eventSchema);