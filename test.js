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
            // Changed to 'published' as it's common for 'Get all events' public API.
            // Revert to 'draft' if you specifically need draft events here.
            // Also, consider adding 'published' to the default view for the main event list.
            { $match: { status: { $in: ['published'] } } } // Default to published for general events list
        ];

        // IMPORTANT FIX: Convert eventID string to ObjectId
        if (eventID) {
            // Validate if eventID is a valid MongoDB ObjectId format
            if (!mongoose.Types.ObjectId.isValid(eventID)) {
                return res.status(400).json({ message: 'Invalid Event ID format' });
            }
            pipeline.push({ $match: { _id: new mongoose.Types.ObjectId(eventID) } });
        }

        if (category) {
            pipeline.push({ $match: { category: category } });
        }
        // if (eventID) { // This block is now redundant and moved above with the fix
        //     pipeline.push({ $match: { _id: eventID } });
        // }
        if (location) {
            pipeline.push({ $match: { 'location.city': { $regex: location, $options: 'i' } } }); // Added regex for flexible city search
        }
        if (dateFrom && dateTo) {
            // Ensure dates are parsed correctly. For precise range, consider time part.
            pipeline.push({ $match: { date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) } } });
        } else if (dateFrom) { // Allow search from a specific date onwards
            pipeline.push({ $match: { date: { $gte: new Date(dateFrom) } } });
        } else if (dateTo) { // Allow search up to a specific date
            pipeline.push({ $match: { date: { $lte: new Date(dateTo) } } });
        }
        if (search) {
            pipeline.push({ $match: { title: { $regex: search, $options: 'i' } } });
        }

        // Add $lookup to join with tickets
        // Note: If you have `ticketTypes` directly embedded in your Event schema,
        // you might not need this $lookup for price filtering, and instead
        // iterate over the embedded array. But if tickets are a separate collection, this is correct.
        pipeline.push({
            $lookup: {
                from: 'tickets', // The collection name for Ticket model (usually lowercase and plural)
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

            // Using $elemMatch to find events where at least one ticket type matches the price criteria
            pipeline.push({
                $match: {
                    'ticketTypes.price': priceMatchConditions // This is still matching the array directly, which works for simple ranges.
                    // For more complex 'at least one ticket meets criteria', $elemMatch might be safer.
                    // Let's improve this for robustness:
                }
            });
            // Improved price filtering to ensure at least one ticket type matches
            pipeline.push({
                $match: {
                    'ticketTypes': {
                        $elemMatch: priceMatchConditions
                    }
                }
            });
        }


        // Populate organizer after all filtering
        pipeline.push({
            $lookup: {
                from: 'users', // The collection name for User model (assuming 'users')
                localField: 'organizer',
                foreignField: '_id',
                as: 'organizer'
            }
        });

        // Unwind the organizer array from $lookup (since it's a one-to-one relationship)
        pipeline.push({
            $unwind: {
                path: '$organizer',
                preserveNullAndEmptyArrays: true // Keep events even if organizer not found
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
                capacity: 1, // Make sure 'capacity' is actually on your Event model if you're using it
                category: 1,
                images: 1,
                videos: 1,
                status: 1,
                createdAt: 1,
                'organizer._id': 1, // Include organizer _id for frontend checks
                'organizer.name': 1, // Select specific fields from organizer
                ticketTypes: 1 // Keep ticketTypes for further processing if needed, or remove if not.
            }
        });

        let events = await Event.aggregate(pipeline);

        res.json(events);
    } catch (err) {
        console.error("Error in getEvents:", err.message); // More descriptive logging
        // If the error is due to an invalid ObjectId format that bypassed initial check (less likely now)
        if (err.name === 'CastError' && err.path === '_id') {
            return res.status(400).json({ message: 'Invalid event ID provided.' });
        }
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