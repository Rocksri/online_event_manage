const Order = require('../models/Order');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

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


// @desc    Get admin analytics
// @route   GET /api/analytics/admin
exports.getAdminAnalytics = async (req, res) => {
    try {
        const { range } = req.query;
        const rangeMap = {
            week: 7,
            month: 30,
            year: 365
        };
        const days = rangeMap[range] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all necessary data in parallel
        const [totalEvents, totalRevenue, totalUsers, eventsOverTime, revenueOverTime, topCategories, userRoles] = await Promise.all([
            Event.countDocuments(),
            Order.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            User.countDocuments(),
            Event.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: range === 'week' ? "%Y-%U" : range === 'year' ? "%Y" : "%Y-%m",
                                date: "$createdAt"
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { period: "$_id", count: 1, _id: 0 } }
            ]),
            Order.aggregate([
                { $match: { paymentStatus: 'completed', createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: range === 'week' ? "%Y-%U" : range === 'year' ? "%Y" : "%Y-%m",
                                date: "$createdAt"
                            }
                        },
                        amount: { $sum: "$totalAmount" }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { period: "$_id", amount: 1, _id: 0 } }
            ]),
            Event.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } }
            ])
        ]);

        // Process user roles
        const roleCounts = {
            attendeeCount: 0,
            organizerCount: 0,
            adminCount: 0
        };
        userRoles.forEach(role => {
            if (role._id === 'attendee') roleCounts.attendeeCount = role.count;
            if (role._id === 'organizer') roleCounts.organizerCount = role.count;
            if (role._id === 'admin') roleCounts.adminCount = role.count;
        });

        res.json({
            totalEvents,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalUsers,
            eventsOverTime,
            revenueOverTime,
            topCategories,
            ...roleCounts
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};