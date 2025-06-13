const Ticket = require('../models/Ticket');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Event = require('../models/Event');  // Add this import

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
        // Validate ticket availability
        let totalAmount = 0;
        const ticketItems = [];

        for (const item of tickets) {
            const ticket = await Ticket.findById(item.ticketId);
            if (!ticket || ticket.event.toString() !== eventId) {
                return res.status(400).json({ msg: 'Invalid ticket selection' });
            }

            if (ticket.quantity - ticket.sold < item.quantity) {
                return res.status(400).json({ msg: `Not enough ${ticket.name} tickets available` });
            }

            totalAmount += ticket.price * item.quantity;
            ticketItems.push({
                ticketId: ticket._id,
                quantity: item.quantity,
                price: ticket.price
            });
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100, // in cents
            currency: 'usd',
            metadata: { userId: req.user.id, eventId }
        });

        res.json({ clientSecret: paymentIntent.client_secret, totalAmount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Confirm payment and create order
// @route   POST /api/tickets/confirm
exports.confirmPayment = async (req, res) => {
    const { paymentIntentId, eventId, tickets } = req.body;

    try {
        // Verify payment
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ msg: 'Payment not completed' });
        }

        // Create order
        const order = new Order({
            user: req.user.id,
            event: eventId,
            tickets,
            totalAmount: paymentIntent.amount / 100,
            paymentStatus: 'completed',
            paymentMethod: paymentIntent.payment_method_types[0],
            transactionId: paymentIntent.id
        });

        await order.save();

        // Update ticket quantities
        for (const item of tickets) {
            await Ticket.findByIdAndUpdate(item.ticketId, {
                $inc: { sold: item.quantity }
            });
        }

        // TODO: Send confirmation email

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
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