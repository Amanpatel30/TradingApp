const WebSocket = require('ws');
const { getPrice, getMarketFeedStatus } = require('../state/market.state');
const jwtUtils = require('../lib/jwt');
const { getTradingSystemStatus } = require('../state/trading-system.state');

let wss;

// Store subscriptions per client
// ws → Set of subscribed symbols
const clientSubscriptions = new Map();
const clientUsers = new Map();

const buildMarketStatusPayload = () => {
  const feedStatus = getMarketFeedStatus();
  const tradingStatus = getTradingSystemStatus();

  return {
    feedStatus: feedStatus.status,
    lastMarketEventAt: feedStatus.lastMarketEventAt || null,
    marketDataAgeMs: feedStatus.ageMs,
    tradingEnabled: tradingStatus.tradingEnabled,
    tradingDisabledReason: tradingStatus.tradingDisabledReason || '',
    transactionsSupported: tradingStatus.transactionsSupported,
    transactionCheckCompleted: tradingStatus.transactionCheckCompleted,
  };
};

const sendMarketStatus = (ws) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(
    JSON.stringify({
      event: 'market_status',
      data: buildMarketStatusPayload(),
    })
  );
};

const initWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Client connected');

    // Initialize empty subscription set
    clientSubscriptions.set(ws, new Set());
    clientUsers.set(ws, null);
    sendMarketStatus(ws);

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());

        if (parsed.event === 'authenticate') {
          const token = String(parsed.token || '').trim();
          if (!token) {
            ws.send(JSON.stringify({ event: 'error', message: 'Missing websocket token' }));
            return;
          }

          const payload = jwtUtils.verifyAccessToken(token);
          clientUsers.set(ws, String(payload.id || payload._id || ''));
          ws.send(JSON.stringify({ event: 'authenticated', data: { userId: clientUsers.get(ws) } }));
          sendMarketStatus(ws);
          return;
        }

        if (parsed.event === 'subscribe') {
          const symbol = parsed.symbol?.toUpperCase();
          if (!symbol) return;

          const latest = getPrice(symbol);

          if (!latest) {
            ws.send(JSON.stringify({
              event: 'error',
              message: `Symbol ${symbol} is not supported`
            }));
            return;
          }

          clientSubscriptions.get(ws).add(symbol);

          ws.send(JSON.stringify({
            event: 'price_update',
            data: latest
          }));
        }

        if (parsed.event === 'unsubscribe') {
          const symbol = parsed.symbol?.toUpperCase();
          if (!symbol) return;

          clientSubscriptions.get(ws).delete(symbol);
        }
      } catch (err) {
        console.error('Invalid WS message:', err.message);
        ws.send(JSON.stringify({ event: 'error', message: err.message || 'Invalid websocket message' }));
      }
    });

    ws.on('close', () => {
      console.log('🔴 Client disconnected');
      clientSubscriptions.delete(ws);
      clientUsers.delete(ws);
    });
  });

  setInterval(() => {
    if (!wss) {
      return;
    }

    const payload = JSON.stringify({
      event: 'market_status',
      data: buildMarketStatusPayload(),
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }, 1000);

  console.log('✅ WebSocket server initialized');
};

const broadcastPrice = (symbol, data) => {
  if (!wss) return;

  const message = JSON.stringify({
    event: 'price_update',
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;

    const subscriptions = clientSubscriptions.get(client);

    // Only send if client subscribed to this symbol
    if (subscriptions && subscriptions.has(symbol)) {
      client.send(message);
    }
  });
};

const broadcastUserEvent = (userId, event, data) => {
  if (!wss || !userId) return;

  const message = JSON.stringify({
    event,
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (clientUsers.get(client) !== String(userId)) return;
    client.send(message);
  });
};

const broadcastMarketStatus = () => {
  if (!wss) return;

  const message = JSON.stringify({
    event: 'market_status',
    data: buildMarketStatusPayload(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

module.exports = {
  initWebSocketServer,
  broadcastPrice,
  broadcastUserEvent,
  broadcastMarketStatus,
};
