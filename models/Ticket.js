const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: { type: String, required: true },
    type: {
        type: String,
        enum: ['general', 'vip', 'premium', 'student'],
        default: 'general'
    },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    sold: { type: Number, default: 0 },
    validFrom: Date,
    validUntil: Date
});

module.exports = mongoose.model('Ticket', ticketSchema);