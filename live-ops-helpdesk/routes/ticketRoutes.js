const express = require("express");

const {
    getTickets,
    createTicket,
    claimTicket
} = require("../controllers/ticketController");

const router = express.Router();

router.get("/", getTickets);

router.post("/", createTicket);

router.patch("/:id/claim", claimTicket);

module.exports = router;