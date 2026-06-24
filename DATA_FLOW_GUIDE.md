# Project Data Flow Guide

This guide maps out exactly how data moves through the CryptoSim application, using the **actual file and function names** from the source code.

---

## Flow 1: The Trade Lifecycle (Limit Order)
This is the path a "Limit Order" takes from the moment you click "Buy" until it becomes an open position.

### Phase A: Order Creation (Request)
1.  **`TradeSimulator.jsx`**: User clicks "Buy / Long". Calls `submitOrder()`, which then calls `appApi.placeLimitOrder()`.

    - **Why:** To initiate the intent to trade. The frontend captures user input (price, size) and sends it to the server.

2.  **`backend/src/routes/v1.js`**: Request hits `router.use('/orders', orderRoutes)`.
    - **Why:** To direct all order-related traffic to the orders module.

3.  **`backend/src/modules/orders/routes.js`**: Middleware `authenticate` runs, followed by `validateRequest(createOrderSchema)`. Hits `router.post('/', ..., createLimitOrder)`.
    - **Why:** To ensure the user is identity-verified and the trade data is mathematically valid before any processing happens.

4.  **`backend/src/modules/orders/controllers/create-limit-order.js`**: The `createLimitOrder` controller extracts `req.body` and `req.user.id`, then calls `placeLimitOrderService()`.
    - **Why:** To bridge the web request to the core trading logic.

5.  **`backend/src/modules/orders/services/place-limit-order-service.js`**: 
    - Calls `reserveWalletBalanceAtomic()` in **`wallet-atomic-service.js`**.
        - **Why:** To atomically "lock" the user's USDT so they cannot spend it elsewhere while the order is open.
    - Saves the order to MongoDB with `status: "OPEN"`.
        - **Why:** To persist the order so the matching engine can monitor the market for an entry.

### Phase B: Order Matching (Execution)
6.  **`backend/src/integrations/binance.service.js`**: A new price ticker arrives from Binance via WebSocket.
7.  **`backend/src/modules/orders/services/matching-engine-service.js`**: `checkAndExecuteOrders(symbol, currentPrice)` is called on every price tick.
    - **Why:** To constantly check if any `OPEN` orders have had their `limitPrice` hit.
8.  **`backend/src/modules/orders/services/matching-runtime-service.js`**: `registerLimitConfirmation()` ensures the price is stable (2 ticks).
    - **Why:** To prevent "flash" fills on low-volume glitches.
9.  **`backend/src/modules/orders/services/matching-engine-service.js`**: Calls `processOrder()`, which changes status to `PROCESSING`.
    - **Why:** To "claim" the order in a multi-tick environment.
10. **`backend/src/modules/orders/services/position-engine-service.js`**: `openPosition()` is called to create a new `Position` document.
    - **Why:** To officially start the trade tracking for the user.
11. **`backend/src/modules/orders/services/matching-engine-service.js`**: Finalizes the order as `status: "FILLED"`.

### Phase C: Notification (Real-time)
12. **`backend/src/modules/orders/services/trading-realtime-service.js`**: Calls `emitUserTradingEvent(userId, 'order_filled', ...)`.
13. **`backend/src/websocket/ws.server.js`**: `broadcastUserEvent()` sends the message to the user's specific socket.
14. **`frontend/src/app/components/AppLayout.jsx`**: WebSocket listener catches the message and dispatches a browser event: `new CustomEvent("app:trading-event", ...)`.
15. **`frontend/src/app/pages/TradeSimulator.jsx`**: `handleTradingEvent` catches the custom event and calls `loadSimulatorData()`.
    - **Why:** To trigger a React re-render so the user sees their new position instantly.

---

## Flow 2: Real-time Market Data Flow
How a price change on Binance gets to your candlestick chart.

1.  **`binance.service.js`**: WebSocket `ws.on('message')` receives a ticker.
2.  **`backend/src/state/market.state.js`**: `updatePrice(symbol, marketData)` updates the in-memory cache.
    - **Why:** High-speed access for the matching engine and API.
3.  **`backend/src/websocket/ws.server.js`**: `broadcastPrice(symbol, marketData)` pushes data to subscribed clients.
4.  **`frontend/src/app/lib/realtime.js`**: `socket.addEventListener("message")` receives the price packet.
5.  **`frontend/src/app/components/AppLayout.jsx`**: Dispatches `new CustomEvent("app:price-update", ...)`.
6.  **`frontend/src/app/pages/TradeSimulator.jsx`**: `handlePriceUpdate` updates the `marketSnapshot` state.
7.  **`frontend/src/app/components/CandlestickChart.jsx`**: Receives the new candles/price via props and re-renders.

---

## Flow 3: Dashboard & Analytics Flow
How your stats are updated after a trade closes.

1.  **`position-engine-service.js`**: `closePositionWithPrice()` is called.
2.  **`backend/src/modules/dashboard/services/snapshot-service.js`**: `rebuildUserPortfolioSnapshots(userId)` recalculates the entire dashboard.
    - **Why:** To ensure "Win Rate" and "Net Profit" reflect the latest closed trade.
3.  **`trading-realtime-service.js`**: `emitPortfolioUpdated(userId)` tells the frontend to refresh.
4.  **`AppLayout.jsx`**: Receives `portfolio_updated`, updates `portfolioValue` in the top header.

---

## Flow 4: Authentication Flow
1.  **`LoginPage.jsx`**: Calls `authApi.login(email, password)`.
2.  **`backend/src/modules/auth/controllers/login.js`**: `login` controller calls `authService.login()`.
3.  **`backend/src/modules/auth/services/login-service.js`**: `login(email, password)` verifies the user and calls `jwtUtils.generateTokens()`.
4.  **`frontend/src/app/context/AppSession.jsx`**: `saveAuthSession(payload)` saves tokens to `localStorage` and sets the React context.
5.  **`backend/src/middlewares/authenticate.js`**: `authenticate(req, res, next)` verifies the `Bearer` token on every API call.
