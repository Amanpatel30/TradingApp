# CryptoSim: Low-Level Technical Guide

This guide breaks down exactly how each component of the CryptoSim application works at a fundamental level, including the **"Why"** behind each system's logic.

---

## 1. Backend: The Engine Room

### `backend/src/index.js` (The Orchestrator)
- **What it does:** Acts as the "Conductor" of the application. It doesn't do the heavy lifting itself, but it manages the **timing and dependencies** of all other services.
- **Why?** To ensure a stable startup. If the Binance stream started before the Database was connected, the app would crash trying to save data that has no destination.
- **Low-Level Flow:**
    1. Connects to MongoDB via `mongoose.js`.
    2. Initializes the WebSocket server (`initWebSocketServer`).
    3. Handles standard Express middleware (CORS, Body-Parser).
    4. **Recovery:** Runs `reconcileTradingState` and starts a recovery loop.
        - **Why?** To fix "ghost orders" that might have been left in a `PROCESSING` state if the server crashed mid-trade.
    5. **Seeding:** Automatically creates a demo user and assets if the DB is empty.
    6. **Stream Start:** Connects to the Binance WebSocket API *only after* the internal server is healthy.

### `backend/src/integrations/binance.service.js` (External Data)
- **Function:** `startBinanceStream(symbols)`
- **Low-Level Flow:**
    - Opens a WebSocket connection to Binance.
    - On every message:
        1. Parses the JSON ticker data.
        2. Calls `updatePrice` in `market.state.js`.
            - **Why?** To update the fast in-memory cache for the rest of the app to use.
        3. Calls `broadcastPrice` in `ws.server.js`.
            - **Why?** To push the new price to all connected browsers instantly.
        4. Triggers the **Matching Engine** (`checkAndExecuteOrders`).
            - **Why?** To see if this new price fills any user's limit orders.
        5. Periodically (every 15s) saves the ticker to MongoDB.

### `backend/src/modules/orders/services/matching-engine-service.js` (The Brain)
- **Logic:** This service is the "Matchmaker" between prices and orders.
- **Why sequential?** It uses `matching-runtime-service.js` to ensure price ticks are processed one-by-one. This prevents two ticks from accidentally filling the same order twice.
- **Step-by-step Execution:**
    1. Mark order as `PROCESSING`.
        - **Why?** To "lock" the order so no other process can touch it.
    2. Reserve wallet balance (Atomic operation).
        - **Why?** To ensure the user has enough money and "lock" those funds for this specific trade.
    3. Create a `Position` record.
    4. Finalize order as `FILLED`.
    5. Trigger real-time updates to the user.

### `backend/src/modules/orders/services/wallet-atomic-service.js` (The Bank)
- **Logic:** Uses MongoDB's atomic `$inc` and `$gte` operators.
- **Why?** To prevent **Race Conditions**. By doing the "Check" (Do they have enough money?) and the "Action" (Subtract it) in one single database command, it's impossible for a user to "double-spend" their balance.

---

## 2. Real-Time Communication

### `backend/src/websocket/ws.server.js`
- **What it does:** Manages individual browser connections.
- **Internal State:** Keeps a `Map` of users and their "subscriptions."
- **Why?** Efficiency. Instead of broadcasting every coin's price to every user, the server only sends "Bitcoin" data to users who are actually looking at the Bitcoin chart.

---

## 3. Frontend: The Visualizer

### `frontend/src/app/lib/realtime.js`
- **What it does:** The "Client Side" of the WebSocket.
- **Why?** To manage the connection lifecycle (connecting, authenticating with JWT, and auto-reconnecting if the WiFi drops).

### `frontend/src/app/components/AppLayout.jsx`
- **What it does:** Acts as the central data hub for the UI.
- **Logic:** It listens to the socket and dispatches **Custom Browser Events** (like `app:price-update`).
- **Why?** **Decoupling.** This allows the "Header" to update the price and the "Simulator" to update the chart at the same time without them being connected to each other. They both just "listen" to the same broadcast.

---

## 4. Key Security & Integrity Patterns
1. **JWT Authentication:** Every request requires a signed token.
    - **Why?** To ensure you can only see and trade your own money.
2. **Input Validation:** Every request is checked by `zod` schemas.
    - **Why?** To prevent "Injection" attacks or invalid data (like negative prices) from entering the system.
3. **Graceful Degradation:** If Binance disconnects, the UI disables trading.
    - **Why?** To prevent users from trading on "stale" or "old" prices, which would lead to an unfair simulation.
