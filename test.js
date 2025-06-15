// ticketController.js
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Event = require('../models/Event');
const mongoose = require('mongoose');

// @desc    Create ticket type
// @route   POST /api/tickets
exports.createTicket = async (req, res) => {
    const { event, name, type, price, quantity, validFrom, validUntil } = req.body;

    try {
        // Verify event belongs to organizer
        const eventObj = await Event.findById(event);
        if (!eventObj || eventObj.organizer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const newTicket = new Ticket({
            event,
            name,
            type,
            price,
            quantity,
            validFrom,
            validUntil
        });

        const ticket = await newTicket.save();
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Purchase tickets
// @route   POST /api/tickets/purchase
exports.purchaseTickets = async (req, res) => {
    const { eventId, tickets } = req.body;

    try {
        // Basic validation for eventId and tickets array
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ msg: 'Invalid Event ID format.' });
        }
        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            return res.status(400).json({ msg: 'Tickets array is required and cannot be empty.' });
        }

        // Fetch all ticket types for the event to validate against available quantity and calculate total
        const eventTicketTypes = await Ticket.find({ event: eventId });
        const ticketTypeMap = new Map(eventTicketTypes.map(t => [t._id.toString(), t]));

        let totalAmount = 0;
        const validatedTickets = [];

        for (const item of tickets) {
            const { ticketId, quantity } = item;

            if (!mongoose.Types.ObjectId.isValid(ticketId) || quantity <= 0) {
                throw new Error('Invalid ticket ID or quantity provided.');
            }

            const ticket = ticketTypeMap.get(ticketId);

            if (!ticket) {
                throw new Error(`Ticket type with ID ${ticketId} not found for this event.`);
            }

            // Client-side check (can still be raced but provides immediate feedback)
            if (ticket.sold + quantity > ticket.quantity) {
                throw new Error(`Not enough tickets available for ${ticket.name}. Only ${ticket.quantity - ticket.sold} left.`);
            }

            totalAmount += ticket.price * quantity;
            validatedTickets.push({ ticketId: ticket._id, quantity });
        }

        // --- Stripe Payment Intent Creation (Removed for brevity, assuming successful payment) ---
        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: Math.round(totalAmount * 100), // amount in cents
        //     currency: 'usd',
        //     payment_method_types: ['card'],
        // });

        // Iterate through validatedTickets to atomically update sold count for each
        for (const item of validatedTickets) {
            const { ticketId, quantity } = item;

            // Atomically update the 'sold' count, ensuring we don't oversell.
            // The $expr operator allows for using aggregation expressions in the query portion,
            // which enables comparison of fields within the same document.
            const updatedTicket = await Ticket.findOneAndUpdate(
                {
                    _id: ticketId,
                    // Condition: (total quantity - currently sold) >= quantity to purchase
                    $expr: {
                        $gte: [
                            { $subtract: ["$quantity", "$sold"] }, // Remaining tickets
                            quantity // Quantity to purchase
                        ]
                    }
                },
                {
                    $inc: { sold: quantity } // Increment sold tickets
                },
                { new: true } // Return the updated document
            );

            if (!updatedTicket) {
                // If updatedTicket is null, it means no document matched the query criteria.
                // This typically happens if the ticketId is wrong or if there weren't enough tickets
                // available when the atomic update was attempted (due to a race condition).
                throw new Error(`Failed to update ticket count for ticket type ${ticketTypeMap.get(ticketId)?.name || ticketId}. It might be sold out or not found.`);
            }
        }

        // Create order (Assuming payment was successful)
        const order = new Order({
            user: req.user.id, // Assuming req.user is populated by authentication middleware
            event: eventId,
            tickets: validatedTickets,
            totalAmount,
            paymentStatus: 'completed',
            // paymentMethod: paymentIntent.payment_method_types[0], // Uncomment if using Stripe
            // transactionId: paymentIntent.id // Uncomment if using Stripe
        });

        await order.save();

        res.json(order);
    } catch (err) {
        console.error('Purchase Tickets Error:', err);
        // Provide more specific error messages to the frontend
        if (err.message.includes('Not enough tickets available') || err.message.includes('sold out')) {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server error: ' + err.message);
    }
};

// @desc    Get user orders
// @route   GET /api/tickets/orders
exports.getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .populate('event', 'title date')
            .populate('tickets.ticketId', 'name type');

        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getTicketsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: 'Invalid Event ID format.' });
        }
        const tickets = await Ticket.find({ event: eventId });
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};