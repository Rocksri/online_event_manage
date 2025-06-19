const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['attendee', 'organizer'], required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    response: { type: String }, // for admin replies
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
