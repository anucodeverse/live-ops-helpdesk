const API_URL =
    "https://live-ops-helpdesk-3an1.onrender.com";


// ==========================================
// SOCKET CONNECTION
// ==========================================

const socket = io(API_URL, {
    transports: ["websocket", "polling"]
});


// ==========================================
// STATE
// ==========================================

let currentAgent = null;

let tickets = [];

const lockedTickets = new Map();


// ==========================================
// DOM
// ==========================================

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );

const agentNameElement =
    document.getElementById(
        "agentName"
    );

const ticketContainer =
    document.getElementById(
        "ticketContainer"
    );

const activityLog =
    document.getElementById(
        "activityLog"
    );

const totalTickets =
    document.getElementById(
        "totalTickets"
    );

const availableTickets =
    document.getElementById(
        "availableTickets"
    );

const lockedTicketsCount =
    document.getElementById(
        "lockedTickets"
    );


// ==========================================
// ACTIVITY LOG
// ==========================================

function addLog(message) {

    const time =
        new Date().toLocaleTimeString();

    const item =
        document.createElement("div");

    item.className = "log-item";

    item.innerHTML = `
        <span class="log-time">
            ${time}
        </span>

        <span>
            ${message}
        </span>
    `;

    activityLog.prepend(item);
}


// ==========================================
// SOCKET CONNECTED
// ==========================================

socket.on("connect", () => {

    connectionStatus.className =
        "connection online";

    connectionStatus.innerHTML = `
        <span class="status-dot"></span>
        WebSocket Connected
    `;

    connectionText.textContent =
        "Online";

    addLog(
        `Connected to server (${socket.id})`
    );

    // Re-register the current agent after
    // every Socket.IO connection/reconnection
    if (currentAgent) {

        socket.emit(
            "join_dashboard",
            currentAgent
        );

        addLog(
            `${currentAgent} rejoined the dashboard`
        );
    }
});


// ==========================================
// SOCKET ERROR
// ==========================================

socket.on(
    "connect_error",
    (error) => {

        connectionStatus.className =
            "connection offline";

        connectionStatus.innerHTML = `
            <span class="status-dot"></span>
            Connection Error
        `;

        connectionText.textContent =
            "Offline";

        addLog(
            `Connection error: ${error.message}`
        );
    }
);


// ==========================================
// DISCONNECTED
// ==========================================

socket.on(
    "disconnect",
    (reason) => {

        connectionStatus.className =
            "connection offline";

        connectionStatus.innerHTML = `
            <span class="status-dot"></span>
            Disconnected
        `;

        connectionText.textContent =
            "Offline";

        addLog(
            `Socket disconnected: ${reason}`
        );
    }
);


// ==========================================
// JOIN AGENT
// ==========================================

function joinAsAgent(agent) {

    if (!socket.connected) {

        addLog(
            "Cannot join: WebSocket is offline"
        );

        return;
    }

    currentAgent = agent;

    agentNameElement.textContent =
        agent;

    document
        .getElementById("agentAButton")
        .classList
        .remove("active");

    document
        .getElementById("agentBButton")
        .classList
        .remove("active");


    if (agent === "Agent A") {

        document
            .getElementById("agentAButton")
            .classList
            .add("active");

    } else {

        document
            .getElementById("agentBButton")
            .classList
            .add("active");
    }


    socket.emit(
        "join_dashboard",
        agent
    );

    addLog(
        `${agent} joined the dashboard`
    );
}


// ==========================================
// DASHBOARD JOINED
// ==========================================

socket.on(
    "dashboard_joined",
    (data) => {

        addLog(
            `Dashboard joined as ${data.agentName}`
        );
    }
);


// ==========================================
// LOAD TICKETS
// ==========================================

async function loadTickets() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/tickets`
            );

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                "Failed to load tickets"
            );
        }

        tickets = data.tickets;

        renderTickets();

        addLog(
            `Loaded ${tickets.length} tickets`
        );

    } catch (error) {

        console.error(error);

        ticketContainer.innerHTML = `
            <div class="empty-state">
                Failed to load tickets
            </div>
        `;

        addLog(
            `Ticket loading failed: ${error.message}`
        );
    }
}


// ==========================================
// RENDER TICKETS
// ==========================================

function renderTickets() {

    totalTickets.textContent =
        tickets.length;


    let lockedCount = 0;


    ticketContainer.innerHTML = "";


    if (tickets.length === 0) {

        ticketContainer.innerHTML = `
            <div class="empty-state">
                No tickets available
            </div>
        `;

        return;
    }


    tickets.forEach(ticket => {

        const ticketId =
            String(ticket._id);


        const lock =
            lockedTickets.get(ticketId);


        if (lock) {

            lockedCount++;
        }


        const card =
            document.createElement("div");

        card.className =
            "ticket-card";


        const priority =
            ticket.priority || "medium";


        let statusHTML;


        if (lock) {

            statusHTML = `
                <div class="lock-status locked">
                    🔒 Locked by ${lock.agentName}
                </div>
            `;

        } else {

            statusHTML = `
                <div class="lock-status available">
                    🔓 Available
                </div>
            `;
        }


        let buttonHTML;


        if (lock) {

           const isOwner =
    currentAgent === lock.agentName &&
    socket.id === lock.socketId;

            buttonHTML = `
                <button
                    class="ticket-action"
                    onclick="unlockTicket('${ticketId}')"
                    ${isOwner ? "" : "disabled"}
                >
                    ${
                        isOwner
                            ? "Unlock Ticket"
                            : "Locked by " + lock.agentName
                    }
                </button>
            `;

        } else {

            buttonHTML = `
                <button
                    class="ticket-action"
                    onclick="lockTicket('${ticketId}')"
                >
                    🔒 Lock Ticket
                </button>
            `;
        }


        card.innerHTML = `
            <div class="ticket-header">

                <div>
                    <div class="ticket-title">
                        ${ticket.title}
                    </div>

                    <div class="ticket-id">
                        #${ticketId}
                    </div>
                </div>

                <span class="priority ${priority}">
                    ${priority}
                </span>

            </div>


            <div class="ticket-description">
                ${ticket.description}
            </div>


            ${statusHTML}


            <div class="ticket-description">
                Customer:
                <strong>
                    ${ticket.customerName}
                </strong>
            </div>


            ${buttonHTML}

        `;


        ticketContainer.appendChild(card);

    });


    lockedTicketsCount.textContent =
        lockedCount;

    availableTickets.textContent =
        tickets.length - lockedCount;
}


// ==========================================
// LOCK TICKET
// ==========================================

function lockTicket(ticketId) {

    if (!currentAgent) {

        alert(
            "Please select Agent A or Agent B first."
        );

        return;
    }


    if (!socket.connected) {

        alert(
            "WebSocket is not connected."
        );

        return;
    }


    socket.emit(
        "lock_ticket",
        ticketId
    );


    addLog(
        `${currentAgent} requested lock for ticket #${ticketId}`
    );
}


// ==========================================
// TICKET LOCKED
// ==========================================

socket.on(
    "ticket_locked",
    (data) => {

        const ticketId =
            String(data.ticketId);


        lockedTickets.set(
            ticketId,
            {
                agentName:
                    data.agentName,

                socketId:
                    data.socketId
            }
        );


        renderTickets();


        addLog(
            `🔒 Ticket #${ticketId} locked by ${data.agentName}`
        );
    }
);


// ==========================================
// LOCK FAILED
// ==========================================

socket.on(
    "lock_failed",
    (data) => {

        addLog(
            `❌ Lock failed for #${data.ticketId}: ${data.message}`
        );

        alert(
            data.message
        );
    }
);


// ==========================================
// UNLOCK TICKET
// ==========================================

function unlockTicket(ticketId) {

    if (!currentAgent) {
        alert("Please select an agent first.");
        return;
    }

    if (!socket.connected) {
        alert("WebSocket is not connected.");
        return;
    }

    const lock = lockedTickets.get(String(ticketId));

    if (!lock) {
        addLog(`Ticket #${ticketId} is not currently locked.`);
        return;
    }

    const isOwner =
        socket.id === lock.socketId &&
        currentAgent === lock.agentName;

    if (!isOwner) {
        alert(
            `You cannot unlock this ticket. It is locked by ${lock.agentName}.`
        );

        addLog(
            `❌ Unauthorized unlock attempt for #${ticketId} by ${currentAgent}`
        );

        return;
    }

    socket.emit("unlock_ticket", ticketId);

    addLog(
        `${currentAgent} requested unlock for ticket #${ticketId}`
    );
}


// ==========================================
// TICKET UNLOCKED
// ==========================================

socket.on(
    "ticket_unlocked",
    (data) => {

        const ticketId =
            String(data.ticketId);


        lockedTickets.delete(
            ticketId
        );


        renderTickets();


        if (
            data.reason ===
            "disconnect"
        ) {

            addLog(
                `👻 Ghost lock released: #${ticketId} (${data.agentName} disconnected)`
            );

        } else {

            addLog(
                `🔓 Ticket #${ticketId} unlocked by ${data.agentName}`
            );
        }
    }
);


// ==========================================
// UNLOCK FAILED
// ==========================================

socket.on(
    "unlock_failed",
    (data) => {

        addLog(
            `❌ Unlock failed for #${data.ticketId}: ${data.message}`
        );

        alert(
            data.message
        );
    }
);


// ==========================================
// TICKET CREATED
// ==========================================

socket.on(
    "ticket_created",
    (data) => {

        addLog(
            `🆕 New ticket created`
        );

        loadTickets();
    }
);


// ==========================================
// TICKET CLAIMED
// ==========================================

socket.on(
    "ticket_claimed",
    (data) => {

        addLog(
            `📋 Ticket #${data.ticketId} claimed by ${data.assignedTo}`
        );

        loadTickets();
    }
);


// ==========================================
// CLEAR LOGS
// ==========================================

function clearLogs() {

    activityLog.innerHTML = "";

    addLog(
        "Activity log cleared"
    );
}


// ==========================================
// INITIAL LOAD
// ==========================================

loadTickets();