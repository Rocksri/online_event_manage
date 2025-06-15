const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    tickets: [{
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
        quantity: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentMethod: String,
    transactionId: String
}, {
    timestamps: true,
    strictPopulate: false // Add this option
});

module.exports = mongoose.model('Order', orderSchema);