# AI-Assisted Engineering Prompts

## RapidDispatch Live Ops — Sprint 19
### Track B — Fullstack Engineer

This document records the technical doubts and reasoning questions raised during the development of the real-time collaborative helpdesk. AI assistance was used to understand concurrency, Socket.io behavior, debugging, edge cases, and production validation.

---

## 1. Understanding the Race Condition

> I understand that two agents can open the same ticket and overwrite each other's work. Can you explain exactly why this is a race condition and show the sequence of events that causes the conflict?

## 2. Why Use an In-Memory Map?

> The tickets are already stored in MongoDB. Why does the Sprint 19 requirement specifically ask for an in-memory Map for active locks instead of storing the lock directly in the database?

## 3. Choosing the Map Structure

> I need to track which agent owns each ticket lock. What should the key and value of the JavaScript Map represent, and why is this structure suitable for fast lock checking?

## 4. Server as the Source of Truth

> If both browsers maintain their own local ticket state, how can I make sure Agent A and Agent B cannot both believe they successfully locked the same ticket? Which side should make the final lock decision?

## 5. Simultaneous Lock Requests

> If Agent A and Agent B send a lock request for the same ticket almost simultaneously, how should the Node.js server process the requests so that only one agent receives the lock?

## 6. Socket.io Event Design

> The requirements mention `join_dashboard`, `lock_ticket`, and `unlock_ticket`. What responsibility should each Socket.io event have, and how should these events interact with the server-side lock Map?

## 7. Why Use socket.id?

> Why should the lock store the Socket.io `socket.id` instead of relying only on the agent name? What could happen if two connections use the same agent name?

## 8. Broadcasting Lock Changes

> After a ticket is successfully locked, why should the server use `io.emit()` to notify all connected clients instead of updating only the agent who requested the lock?

## 9. Unauthorized Unlock

> If Agent A owns a ticket lock and Agent B sends an `unlock_ticket` request for the same ticket, what server-side validation should happen before allowing the lock to be removed?

## 10. Ghost Lock Problem

> If an agent closes their browser or loses their connection without sending `unlock_ticket`, the lock could remain in memory. How should the Socket.io `disconnect` event detect and clean up these ghost locks?

## 11. Multiple Locks by One Agent

> If one socket has locked several tickets and then disconnects, should the server release only one ticket or every ticket owned by that socket? How should the cleanup logic find all of them?

## 12. Synchronizing the Frontend

> If the server releases a ticket after a disconnect, how does the other browser learn about the change without refreshing the page? What Socket.io event should be used and what should the frontend do with it?

## 13. Production Reconnection

> I noticed that Socket.io can generate a new `socket.id` after reconnection. If the agent was already selected before the reconnect, how should the application register the agent again with the new socket connection?

## 14. Debugging "Unknown Agent"

> My activity log shows that a ticket was released after an agent disconnected, but another lock later appears as "Unknown agent". What could cause the server's `connectedAgents` Map to lose the agent identity, and how should I investigate this?

## 15. Production Dual-Window Validation

> I need to prove the Sprint 19 concurrency requirement in production using two browser windows. What exact sequence should I test to demonstrate successful locking, duplicate lock rejection, normal unlocking, ghost-lock cleanup after closing the owner window, and real-time synchronization without refreshing?

---

## Engineering Focus

The prompts above were used to reason about:

- Race conditions
- Socket.io events
- In-memory lock management
- Socket ownership
- Real-time synchronization
- Unauthorized operations
- Ghost disconnect cleanup
- Reconnection handling
- Production debugging
- Dual-window concurrency testing

AI assistance was used as a technical reasoning and debugging aid while implementing and validating the Sprint 19 requirements.