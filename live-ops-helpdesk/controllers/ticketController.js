const Ticket = require("../models/Ticket");

const getTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch tickets",
            error: error.message
        });
    }
};

const createTicket = async (req, res) => {
    try {
        const ticket = await Ticket.create(req.body);

        // Get Socket.io instance
        const io = req.app.get("io");

        // Notify all connected agents
        io.emit("ticket_created", {
            ticket
        });

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create ticket",
            error: error.message
        });
    }
};
const claimTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { agentName } = req.body;

        if (!agentName) {
            return res.status(400).json({
                success: false,
                message: "Agent name is required"
            });
        }

        const ticket = await Ticket.findOneAndUpdate(
            {
                _id: id,
                assignedTo: null,
                status: "open"
            },
            {
                $set: {
                    assignedTo: agentName,
                    status: "in-progress"
                }
            },
            {
                new: true
            }
        );

        if (!ticket) {
            return res.status(409).json({
                success: false,
                message: "Ticket is already assigned or unavailable"
            });
        }
       
        // Get Socket.io instance
        const io = req.app.get("io");

        // Notify all connected agents
        io.emit("ticket_claimed", {
            ticketId: ticket._id,
            assignedTo: ticket.assignedTo,
            status: ticket.status
        });

        res.status(200).json({
            success: true,
            message: "Ticket claimed successfully",
            ticket
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to claim ticket",
            error: error.message
        });
    }
};
module.exports = {
    getTickets,
    createTicket,
    claimTicket
};