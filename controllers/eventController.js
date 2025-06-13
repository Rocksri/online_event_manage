const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create new event
// @route   POST /api/events
exports.createEvent = async (req, res) => {
    const { title, description, date, time, location, category, images, videos } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            date,
            time,
            location,
            category,
            images,
            videos,
            organizer: req.user.id
        });

        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get all events
// @route   GET /api/events
exports.getEvents = async (req, res) => {
    const { category, location, dateFrom, dateTo, minPrice, maxPrice, search } = req.query;

    try {
        let query = { status: 'published' };

        if (category) query.category = category;
        if (location) query['location.city'] = location;
        if (dateFrom && dateTo) query.date = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
        if (search) query.title = { $regex: search, $options: 'i' };

        // Add price filtering through ticket join
        let events = await Event.find(query).populate('organizer', 'name');

        // Apply price filtering
        if (minPrice || maxPrice) {
            events = events.filter(event => {
                const minTicketPrice = Math.min(...event.ticketTypes.map(t => t.price));
                const maxTicketPrice = Math.max(...event.ticketTypes.map(t => t.price));
                return (
                    (!minPrice || minTicketPrice >= minPrice) &&
                    (!maxPrice || maxTicketPrice <= maxPrice)
                );
            });
        }

        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Update event
// @route   PUT /api/events/:id
exports.updateEvent = async (req, res) => {
    const { title, description, date, time, location, category, images, videos, status } = req.body;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is organizer or admin
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: { title, description, date, time, location, category, images, videos, status } },
            { new: true }
        );

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is organizer or admin
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await event.remove();
        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};