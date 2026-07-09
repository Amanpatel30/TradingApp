# Developer Deep Dive: The Inner Workings of CryptoSim

This document is a technical deep dive into the specific coding patterns and logic flows used in this project. Since you "vibe coded" this, this guide will help you connect the "vibe" to the low-level engineering implementations.

---

## 1. Backend Core Patterns

### A. The Controller-Service-Schema (CSS) Pattern
Almost every module in `backend/src/modules/` follows this strict separation:
- **Routes (`routes.js`):** Defines the URL and attaches middlewares (`authenticate`, `validateRequest`).
- **Controllers (`controllers/`):** Entry points for HTTP requests. They handle `req` and `res`. Their only job is to extract data and call a service.
- **Services (`services/`):** This is where the "Business Logic" lives. They perform database queries and calculations.
- **Schemas (`schema/`):** Mongoose models defining the data structure in MongoDB.

### B. Atomic Database Operations (The "Check-and-Act" Pattern)
To prevent race conditions (e.g., two trades spending the same money), the app avoids "Read-Modify-Write" in JavaScript.

**The Problem with JS-level checks:**
If you check `if (user.balance >= cost)` in JavaScript, you are relying on "old news." If two requests arrive at the exact same millisecond, both might see a balance of $100, both pass the JS check for a $60 item, and the user successfully spends $120. This is a **Double Spend** bug.

**The Atomic Solution:**
The app uses **Atomic MongoDB Operators** to perform the check and the update in one uninterruptible step at the database level.
- **File:** `backend/src/modules/orders/services/wallet-atomic-service.js`
- **Pattern:** Using `$inc` with a query filter.
- **Logic:** `User.updateOne({ _id, balance: { $gte: cost } }, { $inc: { balance: -cost } })`.

**Why it works:**
1. **The Query Filter (`balance: { $gte: cost }`):** This is the "Check." MongoDB only performs the update if this condition is currently true *inside the database* at that exact microsecond.
2. **The Operator (`$inc`):** This is the "Action." Instead of setting a fixed value (which might overwrite a recent deposit), it tells the DB: "Subtract this amount from whatever the current number is."
3. **Failing Safely:** If the user has $40 and tries to spend $60, the query finds **0 documents** that match. No money is subtracted, nothing is corrupted, and the database returns a "0 matched" status, allowing the backend to return an "Insufficient Funds" error safely.

### C. The Sequential Tick Processor
High-frequency market data can cause race conditions if multiple price updates are processed at once for the same user.
- **File:** `backend/src/modules/orders/services/matching-runtime-service.js`
- **Pattern:** Tick Queuing.
- **Logic:** It uses a `Map` of "Active Symbols." If a price update for `BTC` arrives while another is still being processed, the new one is queued. This ensures that order #1 is always filled before order #2 if the price hits them in that sequence.

---

## 2. Real-Time Data Flow (The "Nervous System")

The app uses a 3-step relay to get data from the world to your screen:

1.  **Ingress (`binance.service.js`):** Connects to Binance via `ws` (WebSocket) library. It converts Binance's specific "Ticker" format into a clean internal "MarketData" object.
2.  **Distribution (`ws.server.js`):** The backend maintains a list of connected browsers. It filters the market data: if you are watching `SOL`, it only sends `SOL` data to your socket.
3.  **Egress (`realtime.js` & `AppLayout.jsx`):**
    - The frontend receives the data.
    - It uses **Custom Browser Events** (`window.dispatchEvent`).
    - **Why?** This prevents "Prop Drilling." Any component on any page can just "listen" to the window for `app:price-update` without needing complex state management.

---

## 3. Order Lifecycle (Line-by-Line Logic)

When you click "Buy" on a Limit Order:
1.  **Validation:** `zod` checks if the price is a positive number.
2.  **Reservation:** The `wallet-atomic-service` moves the required USDT from `wallet` to `reservedWallet`.
3.  **Persistence:** The order is saved to the DB with `status: "OPEN"`.
4.  **Matching:**
    - A new price tick arrives.
    - `matching-engine-service.js` finds your order.
    - It "Claims" the order by moving it to `status: "PROCESSING"`.
    - It executes the trade logic (calculating slippage and fees).
    - It marks it `status: "FILLED"`.
5.  **Notification:** The backend sends a WebSocket message `order_filled`.

---

## 4. How to read any file in this project
To understand any file, ask yourself these three questions:
1.  **Is it a Middleware?** (It takes `req, res, next` and sits between the user and the logic).
2.  **Is it a Service?** (It talks to the Database or an External API).
3.  **Is it State?** (It lives in memory to make things fast, like `market.state.js`).

---

## 5. Potential "Trap" Areas for Developers
- **Transaction Support:** If you aren't using a MongoDB Replica Set, `mongo-transaction-service.js` will disable trading. This is a common pitfall during local setup.
- **JWT Expiry:** Access tokens expire in 15 minutes. The frontend `AppSession.jsx` handles "hydration" (re-verifying you) automatically.
- **Tick Queuing:** If you add a `console.log` inside the matching engine, you might slow down the tick processing, causing the queue to grow and the UI to "lag" behind the real market.
