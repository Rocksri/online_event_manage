// ticketController.js
const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Event = require('../models/Event');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Configure email transporter
console.log(process.env.EMAIL_USER, process.env.EMAIL_PASSWORD);
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

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

// @desc    Initiate ticket purchase (create payment intent)
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

        for (const item of tickets) {
            const { ticketId, quantity } = item;

            if (!mongoose.Types.ObjectId.isValid(ticketId) || quantity <= 0) {
                return res.status(400).json({ msg: 'Invalid ticket ID or quantity provided.' });
            }

            const ticket = ticketTypeMap.get(ticketId);

            if (!ticket) {
                return res.status(404).json({ msg: `Ticket type with ID ${ticketId} not found for this event.` });
            }

            // Check if enough tickets are available for purchase (pre-check)
            if (ticket.sold + quantity > ticket.quantity) {
                return res.status(400).json({ msg: `Not enough tickets available for ${ticket.name}. Only ${ticket.quantity - ticket.sold} left.` });
            }

            totalAmount += ticket.price * quantity;
        }

        // Create Stripe Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // amount in cents
            currency: 'usd',
            payment_method_types: ['card'],
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id, // Add this
            totalAmount
        });
    } catch (err) {
        console.error('Payment Intent Creation Error:', err);
        res.status(500).send('Server error: ' + err.message);
    }
};

// @desc    Confirm payment and create order
// @route   POST /api/tickets/confirm
exports.confirmPayment = async (req, res) => {
    console.log(req)
    const { paymentIntentId, eventId, tickets, billingDetails } = req.body;


    try {
        // Retrieve and confirm the payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        console.log("Retrieved Payment Intent:", paymentIntent.id, paymentIntent.status);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ msg: 'Payment not successful. Current status: ' + paymentIntent.status });
        }

        // Basic validation for eventId and tickets array
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ msg: 'Invalid Event ID format.' });
        }
        if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
            return res.status(400).json({ msg: 'Tickets array is required and cannot be empty.' });
        }

        // Fetch all ticket types for the event to validate against available quantity
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

            // Perform the server-side check before attempting atomic update
            if (ticket.sold + quantity > ticket.quantity) {
                throw new Error(`Not enough tickets available for ${ticket.name}. Only ${ticket.quantity - ticket.sold} left.`);
            }

            totalAmount += ticket.price * quantity;
            validatedTickets.push({ ticketId: ticket._id, quantity });
        }

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
                throw new Error(`Failed to update ticket count for ticket type ${ticketTypeMap.get(ticketId)?.name || ticketId}. It might be sold out or not found due to concurrent purchases.`);
            }
        }

        // Create order after successful payment and ticket quantity update
        const order = new Order({
            user: req.user.id, // Assuming req.user is populated by authentication middleware
            event: eventId,
            tickets: validatedTickets,
            totalAmount,
            paymentStatus: 'completed',
            paymentMethod: paymentIntent.payment_method_types[0],
            transactionId: paymentIntent.id
        });

        await order.save();

        try {
            const user = await User.findById(req.user.id);
            const event = await Event.findById(eventId);

            const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Replace with your actual frontend URL in .env

            if (billingDetails && billingDetails.email) { // Use billingDetails from req.body
                const eventLink = `${frontendBaseUrl}/events/${event._id}`; // Construct the event link

                const mailOptions = {
                    from: `"EventHub" <${process.env.EMAIL_USER}>`,
                    to: billingDetails.email, // Use billingDetails.email
                    subject: `Your tickets for ${event.title} have been confirmed!`,
                    html: `
                    <h1>Thank you for your purchase!</h1>
                    <p>Here are your ticket details:</p>
                    <p><strong>Event:</strong> ${event.title}</p>
                    <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
                    <p>You can view your tickets in your dashboard.</p>
                    <p><strong><a href="${eventLink}">View Event Details</a></strong></p>
                    <p>Thank you for using EventHub!</p>
                `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                });
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError);
        }

        res.json(order);
    } catch (err) {
        console.error('Payment Confirmation Error:', err);
        // Provide more specific error messages to the frontend
        if (err.message.includes('Not enough tickets available') || err.message.includes('sold out') || err.message.includes('concurrent purchases')) {
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
            .populate({
                path: 'tickets.ticketId',
                model: 'Ticket',
                select: 'name type price' // Add price to selection

            })
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


// @desc    Get tickets by event ID
// @route   GET /api/tickets/event/:eventId
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


exports.cancelTicket = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { ticketIndex } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        if (ticketIndex >= order.tickets.length) {
            return res.status(400).json({ msg: 'Invalid ticket index' });
        }

        const ticket = order.tickets[ticketIndex];
        // Update ticket quantity in Ticket model
        await Ticket.findByIdAndUpdate(ticket.ticketId, {
            $inc: { sold: -ticket.quantity }
        });

        // Remove ticket from order
        order.tickets.splice(ticketIndex, 1);

        // If no tickets left, cancel entire order
        if (order.tickets.length === 0) {
            await order.deleteOne();
        } else {
            await order.save();
        }

        res.json({ msg: 'Ticket cancelled successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

