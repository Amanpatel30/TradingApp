# Project Data Flow Guide

This guide maps out exactly how data moves through the CryptoSim application, from file to file and function to function.

---

## Flow 1: The Trade Lifecycle (Limit Order)
This is the path a "Limit Order" takes from the moment you click "Buy" until it becomes an open position.

### Phase A: Order Creation (Request)
1.  **`TradeSimulator.jsx`**: User clicks "Buy". Calls `appApi.placeLimitOrder()`.
2.  **`backend/src/routes/v1.js`**: Request hits the `/orders` mount.
3.  **`backend/src/modules/orders/routes.js`**: `authenticate` middleware runs, then `validateRequest(createOrderSchema)`.
4.  **`backend/src/modules/orders/controllers/create-order.js`**: Extracts `req.body` and `req.user.id`. Calls `createOrderService`.
5.  **`backend/src/modules/orders/services/create-order-service.js`**:
    - Calls **`wallet-atomic-service.js`** (`reserveWalletBalanceAtomic`) to "lock" the user's USDT.
    - Saves the order to MongoDB with `status: "OPEN"`.
    - Returns success to the UI.

### Phase B: Order Matching (Execution)
6.  **`binance.service.js`**: A new price tick arrives from Binance.
7.  **`matching-engine-service.js`**: `checkAndExecuteOrders()` is called. It finds your `OPEN` order because the market price now matches your `limitPrice`.
8.  **`matching-runtime-service.js`**: `registerLimitConfirmation()` ensures the price is stable (2 ticks) before executing.
9.  **`matching-engine-service.js`**: Calls `processOrder()`.
    - Changes status to `PROCESSING`.
    - Calls **`position-engine-service.js`** (`openPosition()`).
10. **`position-engine-service.js`**: Creates a new `Position` document in MongoDB.
11. **`matching-engine-service.js`**: Finalizes the order as `status: "FILLED"`.

### Phase C: Notification (Real-time)
12. **`trading-realtime-service.js`**: Calls `emitUserTradingEvent()`.
13. **`ws.server.js`**: Sends an `order_filled` message over the WebSocket to the specific user.
14. **`AppLayout.jsx`**: Receives the message, dispatches `app:trading-event`.
15. **`TradeSimulator.jsx`**: Hears the event, calls `loadSimulatorData()`, and refreshes the UI.

---

## Flow 2: Real-time Market Data Flow
This is how a price change on Binance gets to your candlestick chart.

1.  **Binance API**: Sends a JSON packet via WebSocket.
2.  **`binance.service.js`**: `ws.on('message')` parses the packet into a standardized `marketData` object.
3.  **`market.state.js`**: `updatePrice()` saves this data into a fast in-memory JavaScript object.
4.  **`ws.server.js`**: `broadcastPrice()` checks which users are "subscribed" to that symbol and sends the update.
5.  **`realtime.js` (Frontend)**: Receives the JSON update.
6.  **`AppLayout.jsx`**: Dispatches a browser-level `app:price-update` event.
7.  **`TradeSimulator.jsx`**: `useEffect` listener catches the event and updates the `marketSnapshot` state.
8.  **`CandlestickChart.jsx`**: Re-renders with the new price point.

---

## Flow 3: Dashboard & Analytics Flow
How your stats (Win Rate, Profit Factor) are updated after a trade.

1.  **`position-engine-service.js`**: A position is closed (`closePositionWithPrice`).
2.  **`snapshot-service.js`**: `rebuildUserPortfolioSnapshots()` is triggered.
    - Queries all historical `Orders` and `Positions` for that user.
    - Calculates the new `totalPortfolioValue`.
    - Updates the **`dashboardProfile`** inside the `User` document (stat cards, chart data).
3.  **`trading-realtime-service.js`**: Calls `emitPortfolioUpdated()`.
4.  **`AppLayout.jsx`**: Receives `portfolio_updated` event, updates the `portfolioValue` in the top bar.

---

## Flow 4: Authentication Flow
How the app remembers who you are.

1.  **`LoginPage.jsx`**: User submits credentials.
2.  **`auth-controller.js`**: Validates password. Calls `jwt.js` to generate `accessToken`.
3.  **`api.js` (Frontend)**: Stores the token in `localStorage`.
4.  **`AppSession.jsx`**: On every page refresh, it reads `localStorage`.
    - Calls `authApi.getMe()` to "hydrate" the session (fetching the latest user data and balance from the DB).
5.  **`authenticate.js` (Backend Middleware)**: For every subsequent request, it reads the `Bearer` token from the header and attaches the user to the `req` object.

---

## Summary of File Roles
| File Type | Primary Role |
| :--- | :--- |
| **`schema/*.model.js`** | Definition of data in MongoDB. |
| **`modules/*/routes.js`** | Entry points and security rules. |
| **`modules/*/controllers/*.js`** | Request/Response handling. |
| **`modules/*/services/*.js`** | Business logic and math. |
| **`state/*.js`** | Fast, in-memory global variables. |
| **`integrations/*.js`** | Talking to the outside world (Binance). |
| **`websocket/*.js`** | Pushing data to the browser. |
