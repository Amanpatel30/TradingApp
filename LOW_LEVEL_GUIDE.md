# CryptoSim: Low-Level Technical Guide

This guide breaks down exactly how each component of the CryptoSim application works at a fundamental level.

---

## 1. Backend: The Engine Room

### `backend/src/index.js` (The Orchestrator)
- **What it does:** Acts as the "Conductor" of the application. It doesn't do the heavy lifting itself, but it manages the **timing and dependencies** of all other services (DB, WebSockets, External APIs) to ensure they start in the correct order.
- **Low-Level Flow:**
    1. Connects to MongoDB via `mongoose.js`.
    2. Initializes the WebSocket server (`initWebSocketServer`).
    3. Handles standard Express middleware (CORS, Body-Parser).
    4. **Recovery:** Runs `reconcileTradingState` and starts a recovery loop to fix any orders stuck in `PROCESSING` status from a previous crash.
    5. **Seeding:** Automatically creates a demo user and assets if the DB is empty.
    6. **Stream Start:** Connects to the Binance WebSocket API *only after* the internal server is healthy.

### `backend/src/integrations/binance.service.js` (External Data)
- **Function:** `startBinanceStream(symbols)`
- **Low-Level Flow:**
    - Opens a WebSocket connection to `wss://stream.binance.com:9443`.
    - On every message:
        1. Parses the JSON ticker data.
        2. Calls `updatePrice` in `market.state.js`.
        3. Calls `broadcastPrice` in `ws.server.js`.
        4. Triggers the **Matching Engine** (`checkAndExecuteOrders`).
        5. Periodically (every 15s) saves the ticker to MongoDB for historical tracking.

### `backend/src/modules/orders/services/matching-engine-service.js` (The Brain)
- **Logic:**
    - Iterates through all `OPEN` limit orders for the symbol that just received a price update.
    - Compares the current market price to the order's `limitPrice`.
    - If the condition is met (e.g., Price <= Limit for a Buy), it initiates the trade.
    - **Step-by-step Execution:**
        1. Mark order as `PROCESSING`.
        2. Reserve wallet balance (Atomic operation).
        3. Create a `Position` record.
        4. Finalize order as `FILLED`.
        5. Trigger real-time updates to the user.

### `backend/src/modules/orders/services/wallet-atomic-service.js` (The Bank)
- **Logic:** Uses MongoDB's atomic `$inc` operator.
- **Example:** To reserve $100, it sends a command: `update user where balance >= 100 set balance = balance - 100, reserved = reserved + 100`.
- **Safety:** Because this is a single database command, it's impossible for two simultaneous requests to "steal" the same $100.

---

## 2. Real-Time Communication

### `backend/src/websocket/ws.server.js`
- **What it does:** Manages individual browser connections.
- **Internal State:** Keeps a `Map` of which user is connected to which socket and what symbols they have "subscribed" to.
- **Flow:** When a price update comes from Binance, it checks this map and sends the data *only* to users watching that specific coin.

---

## 3. Frontend: The Visualizer

### `frontend/src/app/lib/realtime.js`
- **What it does:** The "Client Side" of the WebSocket.
- **Logic:** Handles the raw connection, sends the JWT token for authentication, and provides an `addRealtimeListener` function so UI components can subscribe to messages.

### `frontend/src/app/components/AppLayout.jsx`
- **What it does:** Acts as the central data hub for the UI.
- **Logic:**
    - It is the primary listener for the WebSocket.
    - When a message arrives, instead of passing it down through 50 layers of "props," it dispatches a **Custom Browser Event** (like `app:price-update`).
    - This allows any page (Dashboard, Simulator, etc.) to listen for data independently.

### `frontend/src/app/pages/TradeSimulator.jsx`
- **Logic:**
    - Listens for `app:price-update`.
    - Calculates "Unrealized PnL" in real-time by comparing the position's `entryPrice` to the `markPrice` in the incoming event.
    - Updates the state, which triggers React to re-render the PnL text and the chart.

---

## 4. Key Security & Integrity Patterns
1. **JWT Authentication:** Every API request and WebSocket connection requires a signed token.
2. **Input Validation:** Every request is checked by `zod` schemas before the logic runs.
3. **Graceful Degradation:** If the Binance feed goes down, the system marks the status as `DISCONNECTED` and disables trading buttons in the UI automatically.
