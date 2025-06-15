// controllers/scheduleController.js
const Schedule = require('../models/Schedule');
const Event = require('../models/Event');
const mongoose = require('mongoose');

exports.updateSchedule = async (req, res) => {
    const { event, sessions } = req.body;

    try {
        // Validate input
        if (!event || !sessions || !Array.isArray(sessions)) {
            return res.status(400).json({ msg: 'Event ID and sessions array are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(event)) {
            return res.status(400).json({ msg: 'Invalid Event ID format' });
        }

        // Validate session data
        for (const [i, session] of sessions.entries()) {
            if (!session.title || !session.startTime || !session.endTime) {
                return res.status(400).json({
                    msg: `Session ${i + 1} missing required fields (title, startTime, endTime)`
                });
            }

            if (new Date(session.startTime) >= new Date(session.endTime)) {
                return res.status(400).json({
                    msg: `Session ${i + 1} has invalid timings (endTime must be after startTime)`
                });
            }
        }

        // Verify event exists and user is authorized (assuming req.user from auth middleware)
        const eventObj = await Event.findById(event);
        if (!eventObj) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // IMPORTANT: Ensure you have an authentication middleware that populates req.user.
        // And that req.user.id holds the user's ID and req.user.role holds their role.
        // The user must be the event organizer or an admin to update the schedule.
        if (eventObj.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to modify this event' });
        }

        // Find or create schedule
        let schedule = await Schedule.findOne({ event });

        if (schedule) {
            // Update existing schedule
            schedule.sessions = sessions;
            schedule.lastUpdated = Date.now();
        } else {
            // Create new schedule if not found
            schedule = new Schedule({ event, sessions });
        }

        await schedule.save();

        res.json(schedule); // Return the saved/updated schedule
    } catch (err) {
        console.error('Schedule Error:', err);
        res.status(500).send('Server error: ' + err.message);
    }
};

exports.getSchedule = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ msg: 'Invalid Event ID format' });
        }

        // Find the schedule for the given event ID
        let schedule = await Schedule.findOne({ event: eventId });

        if (!schedule) {
            // If no schedule is found, return a default empty schedule object with 200 OK.
            // This tells the frontend that no schedule exists yet, allowing it to prompt creation.
            return res.status(200).json({
                event: eventId,
                sessions: []
            });
        }

        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};