# RapidDispatch Live Ops

## Sprint 19 — Track B: Fullstack Engineer

RapidDispatch Live Ops is a real-time helpdesk ticket management system built with **Node.js, Express, Socket.io, and MongoDB**.

The main goal of this project is to prevent two agents from locking the same ticket at the same time and to automatically release tickets when an agent disconnects unexpectedly.

---

## Features

* Real-time ticket locking using Socket.io
* Agent A and Agent B simulation
* Server-side in-memory ticket lock management
* Prevents duplicate ticket locks
* Only the lock owner can unlock a ticket
* Automatic ghost-lock cleanup on disconnect
* Real-time updates without page refresh
* MongoDB ticket storage
* REST API for ticket operations
* Connection and activity monitoring
* Responsive dashboard UI

---

## Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Real-time:** Socket.io
* **Database:** MongoDB with Mongoose
* **Deployment:** Render backend / Vercel or static frontend
* **Development:** Nodemon

---

## Project Structure

```text
live-ops-helpdesk/
│
├── config/
│   └── db.js
│
├── controllers/
│   └── ticketController.js
│
├── models/
│   └── Ticket.js
│
├── routes/
│   └── ticketRoutes.js
│
├── sockets/
│   └── socketHandler.js
│
├── test-client/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
├── prompts.md
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

---

## How Ticket Locking Works

The server maintains an in-memory JavaScript `Map`:

```javascript
const lockedTickets = new Map();
```

The Map stores:

```text
ticketId → socket.id + agentName
```

When an agent requests a lock:

1. Server checks whether the ticket already exists in the Map.
2. If it is already locked, the request is rejected.
3. If it is available, the server stores the lock.
4. The server broadcasts `ticket_locked` to all connected agents.

The **server is the source of truth** for ticket locks.

---

## Socket.io Events

### `join_dashboard`

Registers the connected socket with an agent name.

```text
Agent A → join_dashboard
Agent B → join_dashboard
```

### `lock_ticket`

Requests a lock for a ticket.

If the ticket is available:

```text
ticket_locked
```

If another agent already owns it:

```text
lock_failed
```

### `unlock_ticket`

Releases a ticket lock.

Only the socket that owns the lock can unlock it.

### `disconnect`

Handles unexpected disconnections.

The server searches the lock Map for tickets belonging to the disconnected `socket.id`.

Those locks are automatically removed and the server broadcasts:

```text
ticket_unlocked
reason: "disconnect"
```

This prevents **ghost locks** from remaining forever.

---

## REST API

Base URL:

```text
/api/tickets
```

### Get Tickets

```http
GET /api/tickets
```

Returns all tickets sorted by creation date.

### Create Ticket

```http
POST /api/tickets
```

Creates a new ticket and broadcasts:

```text
ticket_created
```

### Claim Ticket

```http
PATCH /api/tickets/:id/claim
```

Requires:

```json
{
  "agentName": "Agent A"
}
```

The ticket is assigned only when it is still open and unassigned.

---

## Environment Variables

Create a `.env` file in the backend root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5500
```

For production, set `CLIENT_URL` to the deployed frontend URL.

Do not commit `.env` to GitHub.

---

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server runs on:

```text
http://localhost:5000
```

---

## Dual-Window Testing

The project includes a test dashboard inside:

```text
test-client/
```

Open the dashboard in **two browser windows**.

### Test 1 — Successful Lock

1. Open Window 1 as **Agent A**.
2. Open Window 2 as **Agent B**.
3. Select the same ticket.
4. Agent A clicks **Lock Ticket**.
5. Both windows should immediately show the ticket as locked.

No page refresh is required.

### Test 2 — Duplicate Lock

1. Agent A locks a ticket.
2. Agent B attempts to lock the same ticket.
3. Agent B should receive a `lock_failed` response.
4. The ticket remains owned by Agent A.

### Test 3 — Normal Unlock

1. Agent A locks a ticket.
2. Agent A clicks **Unlock Ticket**.
3. Both windows should immediately show the ticket as available.

### Test 4 — Ghost Disconnect

1. Agent A locks a ticket.
2. Confirm Agent B sees the ticket as locked.
3. Close Agent A's browser tab.
4. Socket.io triggers `disconnect`.
5. The server automatically removes Agent A's lock.
6. Agent B receives `ticket_unlocked`.
7. The ticket becomes available without refreshing.

This is the main **ghost-disconnect demonstration** required by Sprint 19.

---

## Production Configuration

The Socket.io server uses the configured frontend origin:

```javascript
process.env.CLIENT_URL
```

Both Express and Socket.io use this value for CORS.

Production architecture:

```text
Frontend
   │
   │ HTTPS / WebSocket
   ▼
Render Node.js Server
   │
   ├── Express REST API
   ├── Socket.io
   └── In-Memory Lock Map
   │
   ▼
MongoDB Atlas
```

For production deployment, make sure the frontend URL is correctly configured in the backend `CLIENT_URL` environment variable.

---

## AI Transparency

Technical reasoning and debugging questions used during development are documented in:

```text
prompts.md
```

The prompts cover:

* Race conditions
* In-memory Maps
* Socket ownership
* Socket.io events
* Real-time synchronization
* Unauthorized unlocks
* Ghost disconnects
* Reconnection handling
* Production debugging
* Dual-window testing

AI assistance was used as a technical reasoning and debugging aid during development.

---

## Important Architecture Note

MongoDB stores the **persistent ticket information**.

The Socket.io server's in-memory `lockedTickets` Map stores the **temporary real-time lock state**.

```text
MongoDB
   ↓
Ticket data

Socket.io Map
   ↓
Active ticket locks
   ↓
socket.id + agentName
```

This separation allows ticket locks to be checked quickly while keeping permanent ticket information in MongoDB.

---

## Submission

### Live Deployment

```text
Frontend URL: <add deployed frontend URL>
Backend URL: https://live-ops-helpdesk-3an1.onrender.com
```

### GitHub

```text
GitHub Repository: <add GitHub repository URL>
```

### Demo Video

The demo video should show:

* Two browser windows
* Agent A and Agent B
* Successful ticket locking
* Duplicate lock rejection
* Normal unlock
* Closing the lock owner's tab
* Automatic ghost-lock release
* Real-time synchronization without refreshing

---

## Project Status

**Sprint 19 — Track B: Fullstack Engineer**

The implementation demonstrates:

* Real-time Socket.io communication
* Server-side ticket locking
* Concurrency protection
* Lock ownership validation
* Ghost-disconnect cleanup
* REST API integration
* MongoDB persistence
* Production CORS configuration
* Dual-window real-time validation
