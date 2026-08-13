const connectedAgents = new Map();

// Tracks which ticket is locked by which socket
const lockedTickets = new Map();

const initializeSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`Agent connected: ${socket.id}`);

        // ==========================================
        // JOIN DASHBOARD
        // ==========================================

        socket.on("join_dashboard", (agentName) => {
            connectedAgents.set(socket.id, agentName);

            console.log(`${agentName} joined the dashboard`);

            socket.emit("dashboard_joined", {
                message: "Successfully joined the dashboard",
                agentName,
                socketId: socket.id
            });
        });

        // ==========================================
        // LOCK TICKET
        // ==========================================

        socket.on("lock_ticket", (ticketId) => {
            const normalizedTicketId = String(ticketId);

            const agentName =
                connectedAgents.get(socket.id) || "Unknown agent";

            // Check if ticket is already locked
            if (lockedTickets.has(normalizedTicketId)) {
                const lockedBy =
                    lockedTickets.get(normalizedTicketId);

                console.log(
                    `Ticket ${normalizedTicketId} is already locked by ${lockedBy.agentName}`
                );

                // Tell requesting agent that lock failed
                socket.emit("lock_failed", {
                    ticketId: normalizedTicketId,
                    message:
                        `Ticket is already locked by ${lockedBy.agentName}`,
                    lockedBy: lockedBy.agentName
                });

                return;
            }

            // Lock the ticket
            lockedTickets.set(normalizedTicketId, {
                socketId: socket.id,
                agentName
            });

            console.log(
                `Ticket ${normalizedTicketId} locked by ${agentName}`
            );

            // Tell ALL connected agents
            io.emit("ticket_locked", {
                ticketId: normalizedTicketId,
                agentName,
                socketId: socket.id
            });
        });

        // ==========================================
        // UNLOCK TICKET
        // ==========================================

        socket.on("unlock_ticket", (ticketId) => {
            const normalizedTicketId = String(ticketId);

            // Check whether ticket is actually locked
            if (!lockedTickets.has(normalizedTicketId)) {
                socket.emit("unlock_failed", {
                    ticketId: normalizedTicketId,
                    message: "Ticket is not currently locked"
                });

                return;
            }

            const lock = lockedTickets.get(normalizedTicketId);

            // Only the agent who owns the lock can unlock it
            if (lock.socketId !== socket.id) {
                socket.emit("unlock_failed", {
                    ticketId: normalizedTicketId,
                    message: "You do not own the lock for this ticket",
                    lockedBy: lock.agentName
                });

                return;
            }

            // Remove the lock
            lockedTickets.delete(normalizedTicketId);

            console.log(
                `Ticket ${normalizedTicketId} unlocked by ${lock.agentName}`
            );

            // Tell ALL connected agents
            io.emit("ticket_unlocked", {
                ticketId: normalizedTicketId,
                agentName: lock.agentName,
                socketId: socket.id
            });
        });

        // ==========================================
        // DISCONNECT / GHOST LOCK CLEANUP
        // ==========================================

        socket.on("disconnect", () => {
            const agentName =
                connectedAgents.get(socket.id);

            console.log(
                `${agentName || "Unknown agent"} disconnected: ${socket.id}`
            );

            // Find every ticket locked by this socket
            for (const [
                ticketId,
                lock
            ] of lockedTickets.entries()) {

                if (lock.socketId === socket.id) {
                    // Remove the ghost lock
                    lockedTickets.delete(ticketId);

                    console.log(
                        `Ghost lock released: Ticket ${ticketId} was locked by ${lock.agentName}`
                    );

                    // Notify all remaining agents
                    io.emit("ticket_unlocked", {
                        ticketId,
                        agentName: lock.agentName,
                        socketId: socket.id,
                        reason: "disconnect"
                    });
                }
            }

            // Remove disconnected agent
            connectedAgents.delete(socket.id);
        });
    });
};

module.exports = initializeSocket;