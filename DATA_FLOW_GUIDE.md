# Project Data Flow Guide

This guide maps out exactly how data moves through the CryptoSim application, explaining not just **where** it goes, but **why** each step is necessary for a secure and reactive system.

---

## Flow 1: The Trade Lifecycle (Limit Order)
This is the path a "Limit Order" takes from the moment you click "Buy" until it becomes an open position.

### Phase A: Order Creation (Request)
1.  **`TradeSimulator.jsx`**: User clicks "Buy". Calls `appApi.placeLimitOrder()`.
    - **Why:** To initiate the intent to trade. The frontend captures user input (price, size) and sends it to the server.
2.  **`backend/src/routes/v1.js`**: Request hits the `/orders` mount.
    - **Why:** The project uses versioned routing (`/v1`). This route acts as a traffic controller, directing all order-related requests to the correct module.
3.  **`backend/src/modules/orders/routes.js`**: `authenticate` middleware runs, then `validateRequest(createOrderSchema)`.
    - **Why:** **Security & Integrity.** `authenticate` ensures the user is logged in. `validateRequest` ensures the data (like price) is a valid number before it touches the database, preventing "junk data" or attacks.
4.  **`backend/src/modules/orders/controllers/create-order.js`**: Extracts `req.body` and `req.user.id`. Calls `createOrderService`.
    - **Why:** **Separation of Concerns.** The controller's job is only to handle the "web" part (HTTP). It hands off the "business" part to a Service.
5.  **`backend/src/modules/orders/services/create-order-service.js`**:
    - Calls **`wallet-atomic-service.js`** (`reserveWalletBalanceAtomic`).
        - **Why:** To "lock" the user's USDT. This prevents them from spending the same money on two different orders at once.
    - Saves the order to MongoDB with `status: "OPEN"`.
        - **Why:** To persist the order so that the matching engine can find it later when the price hits the target.
    - Returns success to the UI.

### Phase B: Order Matching (Execution)
6.  **`binance.service.js`**: A new price tick arrives from Binance.
    - **Why:** To provide real-world market data that drives the simulator's execution.
7.  **`matching-engine-service.js`**: `checkAndExecuteOrders()` is called.
    - **Why:** This is the "Engine" that constantly compares live prices against all `OPEN` orders in the database.
8.  **`matching-runtime-service.js`**: `registerLimitConfirmation()` runs.
    - **Why:** **Stability.** It ensures the price has actually "touched" the limit for at least 2 ticks, preventing execution on a single "glitch" or outlier price point.
9.  **`matching-engine-service.js`**: Calls `processOrder()`.
    - Changes status to `PROCESSING`.
        - **Why:** To "claim" the order so that no other simultaneous price update tries to execute it at the same time (Race Condition protection).
    - Calls **`position-engine-service.js`** (`openPosition()`).
10. **`position-engine-service.js`**: Creates a new `Position` document.
    - **Why:** To represent that the user now "owns" the asset and can track its profit/loss.
11. **`matching-engine-service.js`**: Finalizes the order as `status: "FILLED"`.
    - **Why:** To mark the order's lifecycle as complete.

### Phase C: Notification (Real-time)
12. **`trading-realtime-service.js`**: Calls `emitUserTradingEvent()`.
    - **Why:** To trigger the notification system. The backend knows the trade is done, but the user doesn't yet.
13. **`ws.server.js`**: Sends an `order_filled` message over the WebSocket.
    - **Why:** To "push" the data to the user's browser instantly without them having to refresh the page.
14. **`AppLayout.jsx`**: Receives the message, dispatches `app:trading-event`.
    - **Why:** To broadcast the news internally to all parts of the React app that might be listening.
15. **`TradeSimulator.jsx`**: Hears the event, calls `loadSimulatorData()`.
    - **Why:** To refresh the local UI state so the user sees their new position and updated balance immediately.

---

## Flow 2: Real-time Market Data Flow
This is how a price change on Binance gets to your candlestick chart.

1.  **Binance API**: Sends a JSON packet via WebSocket.
    - **Why:** To provide high-frequency, low-latency market updates.
2.  **`binance.service.js`**: Parses the packet into a standardized `marketData` object.
    - **Why:** To transform Binance's specific format (like using `"c"` for close price) into a format your app understands (`price`).
3.  **`market.state.js`**: `updatePrice()` saves this to an in-memory object.
    - **Why:** **Performance.** Reading from a JavaScript object is 1000x faster than querying a database every time a component needs the current price.
4.  **`ws.server.js`**: `broadcastPrice()` sends the update to subscribed users.
    - **Why:** To ensure users only get data for the coins they are actually watching, saving bandwidth.
5.  **`realtime.js` (Frontend)**: Receives the JSON update.
    - **Why:** To act as the bridge between the server's socket and the React app.
6.  **`AppLayout.jsx`**: Dispatches a browser-level `app:price-update` event.
    - **Why:** To allow any component (Chart, Header, Ticker) to "hear" the price change without using complex global state like Redux.
7.  **`TradeSimulator.jsx`**: Updates its `marketSnapshot` state.
    - **Why:** To trigger a React re-render of the price text and PnL calculations.
8.  **`CandlestickChart.jsx`**: Re-renders with the new price point.
    - **Why:** To visually represent the price movement in the chart.

---

## Flow 3: Dashboard & Analytics Flow
How your stats (Win Rate, Profit Factor) are updated after a trade.

1.  **`position-engine-service.js`**: A position is closed (`closePositionWithPrice`).
    - **Why:** The trade is finished, and we now know the final Profit/Loss.
2.  **`snapshot-service.js`**: `rebuildUserPortfolioSnapshots()` is triggered.
    - **Why:** To convert raw trade data into human-readable analytics.
    - It calculates the new `totalPortfolioValue` and updates the **`dashboardProfile`**.
        - **Why:** So the "Win Rate" and "Net Profit" cards on the dashboard reflect the latest trade instantly.
3.  **`trading-realtime-service.js`**: Calls `emitPortfolioUpdated()`.
    - **Why:** To tell the frontend that its cached balance and stats are now out of date.
4.  **`AppLayout.jsx`**: Receives `portfolio_updated` event, updates the top bar balance.
    - **Why:** So the user sees their new total money at the top of the screen immediately.

---

## Flow 4: Authentication Flow
How the app remembers who you are.

1.  **`LoginPage.jsx`**: User submits credentials.
    - **Why:** To prove identity.
2.  **`auth-controller.js`**: Calls `jwt.js` to generate an `accessToken`.
    - **Why:** **Stateless Security.** Instead of the server "remembering" you, it gives you a signed "passport" (JWT) that you show with every future request.
3.  **`api.js` (Frontend)**: Stores the token in `localStorage`.
    - **Why:** So that if you refresh the page or close your browser, you stay logged in.
4.  **`AppSession.jsx`**: On refresh, it calls `authApi.getMe()`.
    - **Why:** **"Hydration."** It fetches your latest name, balance, and settings from the database to populate the UI.
5.  **`authenticate.js` (Backend Middleware)**: Reads the `Bearer` token.
    - **Why:** To verify your "passport" on every single request, ensuring you can only see *your* trades and not someone else's.

---

## Summary of File Roles
| File Type | Primary Role | Why it exists |
| :--- | :--- | :--- |
| **`schema/*.model.js`** | Data Definition | To define the structure and rules of your data in MongoDB. |
| **`modules/*/routes.js`** | Entry points | To define URLs and apply security/validation filters. |
| **`modules/*/controllers/*.js`** | Request Handling | To bridge the gap between the Web (HTTP) and the App Logic. |
| **`modules/*/services/*.js`** | Business Logic | To perform the actual math and database operations. |
| **`state/*.js`** | In-memory State | To provide ultra-fast access to volatile data (like prices). |
| **`integrations/*.js`** | External Connection | To interact with outside services like Binance. |
| **`websocket/*.js`** | Real-time Push | To send data to the user without them asking for it. |
