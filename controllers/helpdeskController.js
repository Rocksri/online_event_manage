const SupportTicket = require('../models/SupportTicket');

exports.submitTicket = async (req, res) => {
    try {
        console.log('Incoming ticket:', req.body);
        console.log('Authenticated user:', req.user);

        const { subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Missing subject or message' });

        const ticket = await SupportTicket.create({
            user: req.user.id,
            role: req.user.role,
            subject,
            message
        });

        res.status(201).json(ticket);
    } catch (err) {
        console.error('Ticket submission failed:', err);
        res.status(500).json({ error: 'Failed to submit ticket' });
    }
};


exports.getMyTickets = async (req, res) => {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tickets);
};

exports.getAllTickets = async (req, res) => {
    const tickets = await SupportTicket.find().populate('user', 'name email role').sort({ createdAt: -1 });
    res.json(tickets);
};

exports.respondToTicket = async (req, res) => {
    const { response } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    ticket.response = response;
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    await ticket.save();
    res.json(ticket);
};
