const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const ticketRoutes = require("./routes/ticketRoutes");
const initializeSocket = require("./sockets/socketHandler");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"],
        credentials: true
    }
});

initializeSocket(io);

app.set("io", io);
app.use(
    cors({
        origin:"http://localhost:5500",
        credentials: true
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Live Ops Helpdesk API is running"
    });
});

app.use("/api/tickets", ticketRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();