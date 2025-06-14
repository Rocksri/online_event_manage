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

        // Verify event exists and user is authorized
        const eventObj = await Event.findById(event);
        if (!eventObj) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (eventObj.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to modify this event' });
        }

        // Find or create schedule
        let schedule = await Schedule.findOne({ event });

        if (schedule) {
            schedule.sessions = sessions;
            schedule.lastUpdated = Date.now();
        } else {
            schedule = new Schedule({ event, sessions });
        }

        await schedule.save();

        res.json(schedule);
    } catch (err) {
        console.error('Schedule Error:', err);
        res.status(500).send('Server error: ' + err.message);
    }
};

exports.getSchedule = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
            return res.status(400).json({ msg: 'Invalid Event ID format' });
        }

        const schedule = await Schedule.findOne({ event: req.params.eventId });

        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        res.json(schedule);
    } catch (err) {
        console.error('Get Schedule Error:', err);
        res.status(500).send('Server error: ' + err.message);
    }
};