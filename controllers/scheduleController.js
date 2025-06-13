const Schedule = require('../models/Schedule');
const Event = require('../models/Event'); 
// @desc    Create/update event schedule
// @route   POST /api/schedules
exports.updateSchedule = async (req, res) => {
    const { event, sessions } = req.body;

    try {
        // Verify event belongs to organizer
        const eventObj = await Event.findById(event);
        if (!eventObj || eventObj.organizer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        let schedule = await Schedule.findOne({ event });

        if (schedule) {
            // Update existing schedule
            schedule.sessions = sessions;
            schedule.lastUpdated = Date.now();
        } else {
            // Create new schedule
            schedule = new Schedule({ event, sessions });
        }

        await schedule.save();

        // TODO: Notify registered attendees of schedule change

        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Get event schedule
// @route   GET /api/schedules/:eventId
exports.getSchedule = async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ event: req.params.eventId });
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }

        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};