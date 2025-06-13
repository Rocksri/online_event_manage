const Order = require('../models/Order');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// @desc    Get event analytics
// @route   GET /api/analytics/events/:eventId
exports.getEventAnalytics = async (req, res) => {
    try {
        const eventId = req.params.eventId;

        // Verify event belongs to organizer
        const event = await Event.findById(eventId);
        if (!event || event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Get ticket sales
        const orders = await Order.find({ event: eventId, paymentStatus: 'completed' });

        // Calculate metrics
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const ticketsSold = orders.reduce((sum, order) =>
            sum + order.tickets.reduce((tSum, t) => tSum + t.quantity, 0), 0);

        // Ticket type breakdown
        const ticketTypes = await Ticket.find({ event: eventId });
        const ticketSales = ticketTypes.map(ticket => ({
            name: ticket.name,
            type: ticket.type,
            price: ticket.price,
            available: ticket.quantity,
            sold: ticket.sold,
            revenue: ticket.sold * ticket.price
        }));

        const attendanceRate = event.capacity > 0
            ? (ticketsSold / event.capacity * 100).toFixed(2) + '%'
            : '0%';

        res.json({
            event: event.title,
            totalSales,
            ticketsSold,
            ticketSales,
            attendanceRate: attendanceRate
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get organizer analytics
// @route   GET /api/analytics/organizer
exports.getOrganizerAnalytics = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id });
        const eventIds = events.map(e => e._id);

        const orders = await Order.find({
            event: { $in: eventIds },
            paymentStatus: 'completed'
        });

        // Calculate metrics
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalEvents = events.length;
        const totalAttendees = [...new Set(orders.map(o => o.user.toString()))].length;

        res.json({
            totalEvents,
            totalRevenue,
            totalAttendees,
            avgRevenuePerEvent: totalRevenue / totalEvents || 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};