const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Ticket = require('../models/Ticket'); // Keep this line as you're deleting tickets

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
    const { category, eventID, location, dateFrom, dateTo, minPrice, maxPrice, search } = req.query;

    try {
        let pipeline = [
            { $match: { status: { $in: ['draft', 'published', 'cancelled'] } } } // Original status filter
        ];

        if (category) {
            pipeline.push({ $match: { category: category } });
        }

        // FIX: Convert eventID string to MongoDB ObjectId
        if (eventID) {
            // Validate if eventID is a valid MongoDB ObjectId string
            if (!mongoose.Types.ObjectId.isValid(eventID)) {
                return res.status(400).json({ message: 'Invalid Event ID format.' });
            }
            pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(eventID) } });
        }

        if (location) {
            pipeline.push({ $match: { 'location.city': location } });
        }
        if (dateFrom && dateTo) {
            // Ensure date parsing handles potential timezone issues if your dates are not consistently UTC
            pipeline.push({ $match: { date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } });
        }
        if (search) {
            pipeline.push({ $match: { title: { $regex: search, $options: 'i' } } });
        }

        // Add $lookup to join with tickets
        pipeline.push({
            $lookup: {
                from: 'tickets',
                localField: '_id',
                foreignField: 'event',
                as: 'ticketTypes'
            }
        });

        // Add price filtering after joining tickets
        if (minPrice || maxPrice) {
            let priceMatchConditions = {};
            if (minPrice) {
                priceMatchConditions.$gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                priceMatchConditions.$lte = parseFloat(maxPrice);
            }

            pipeline.push({
                $match: {
                    'ticketTypes.price': priceMatchConditions
                }
            });
        }

        // Populate organizer after all filtering
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'organizer',
                foreignField: '_id',
                as: 'organizer'
            }
        });

        // Unwind the organizer array from $lookup
        pipeline.push({
            $unwind: {
                path: '$organizer',
                preserveNullAndEmptyArrays: true
            }
        });

        // Project to select only necessary organizer fields
        pipeline.push({
            $project: {
                title: 1,
                description: 1,
                date: 1,
                time: 1,
                location: 1,
                capacity: 1,
                category: 1,
                images: 1,
                videos: 1,
                status: 1,
                createdAt: 1,
                'organizer.name': 1,
                'organizer._id': 1, // Include organizer's _id if you need it for frontend checks
                ticketTypes: 1
            }
        });

        let events = await Event.aggregate(pipeline);

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
        console.log(event)

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is organizer or admin
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Delete all related data
        await Promise.all([
            Ticket.deleteMany({ event: event._id }),
            // Removed Order.deleteMany as you don't have the model
            // Removed Schedule.deleteOne as you don't have the model
            Event.deleteOne({ _id: event._id })
        ]);

        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error('Delete Event Error:', err.message);

        // Handle specific errors
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid event ID' });
        }

        res.status(500).send('Server error: ' + err.message);
    }
};


exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from URL parameters

        // Validate if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid event ID format.' });
        }

        // Find the event by ID and populate related fields
        // 'organizer' should be populated to get user details
        // 'ticketTypes' should be populated if they are a separate collection
        // If ticketTypes are embedded in the Event model, you don't need to populate them.
        const event = await Event.findById(id)
            .populate('organizer', 'name email') // Populate organizer, selecting name and email
            .populate('ticketTypes'); // Populate ticketTypes if they are a separate collection

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(event);
    } catch (err) {
        console.error(err.message);
        // If it's a cast error (e.g., malformed ID), it's still a 404/400 essentially
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Event not found with that ID' });
        }
        res.status(500).send('Server error');
    }
};


// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        // You can add filtering/pagination here if needed in the future
        const users = await User.find().select('-password'); // Exclude password from the response

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};