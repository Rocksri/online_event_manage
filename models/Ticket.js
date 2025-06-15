// models/Ticket.js
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    name: { type: String, required: true },
    type: { type: String, enum: ['general', 'vip', 'early-bird'], default: 'general' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0 },
    validFrom: { type: Date },
    validUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);