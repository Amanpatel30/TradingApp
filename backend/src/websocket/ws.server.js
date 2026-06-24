const WebSocket = require('ws');
const { getPrice, getMarketFeedStatus } = require('../state/market.state');
const jwtUtils = require('../lib/jwt');
const { getTradingSystemStatus } = require('../state/trading-system.state');

let wss;
let marketStatusInterval;

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

const sendJson = (ws, payload) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(JSON.stringify(payload));
};

const sendMarketStatus = (ws) => {
  sendJson(ws, {
    event: 'market_status',
    data: buildMarketStatusPayload(),
  });
};

const closeWebSocketServer = () => {
  if (marketStatusInterval) {
    clearInterval(marketStatusInterval);
    marketStatusInterval = null;
  }

  if (wss) {
    for (const client of wss.clients) {
      client.close();
    }

    wss.close();
    wss = null;
  }

  clientSubscriptions.clear();
  clientUsers.clear();
};

const initWebSocketServer = (server) => {
  closeWebSocketServer();
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    clientSubscriptions.set(ws, new Set());
    clientUsers.set(ws, null);
    sendMarketStatus(ws);

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());

        if (parsed.event === 'authenticate') {
          const token = String(parsed.token || '').trim();
          if (!token) {
            sendJson(ws, { event: 'error', message: 'Missing websocket token' });
            return;
          }

          const payload = jwtUtils.verifyAccessToken(token);
          clientUsers.set(ws, String(payload.id || payload._id || ''));
          sendJson(ws, {
            event: 'authenticated',
            data: { userId: clientUsers.get(ws) },
          });
          sendMarketStatus(ws);
          return;
        }

        if (parsed.event === 'subscribe') {
          const symbol = parsed.symbol?.toUpperCase();
          if (!symbol) {
            sendJson(ws, { event: 'error', message: 'Missing symbol' });
            return;
          }

          const latest = getPrice(symbol);

          if (!latest) {
            sendJson(ws, {
              event: 'error',
              message: `Symbol ${symbol} is not supported`,
            });
            return;
          }

          clientSubscriptions.get(ws).add(symbol);

          sendJson(ws, {
            event: 'price_update',
            data: latest,
          });
          return;
        }

        if (parsed.event === 'unsubscribe') {
          const symbol = parsed.symbol?.toUpperCase();
          if (!symbol) {
            sendJson(ws, { event: 'error', message: 'Missing symbol' });
            return;
          }

          clientSubscriptions.get(ws).delete(symbol);
          return;
        }

        sendJson(ws, { event: 'error', message: `Unsupported event: ${parsed.event}` });
      } catch (err) {
        sendJson(ws, { event: 'error', message: err.message || 'Invalid websocket message' });
      }
    });

    ws.on('close', () => {
      clientSubscriptions.delete(ws);
      clientUsers.delete(ws);
    });
  });

  marketStatusInterval = setInterval(() => {
    broadcastMarketStatus();
  }, 1000);

  if (marketStatusInterval.unref) {
    marketStatusInterval.unref();
  }

  return wss;
};

const broadcastPrice = (symbol, data) => {
  if (!wss) {
    return;
  }

  const message = JSON.stringify({
    event: 'price_update',
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscriptions = clientSubscriptions.get(client);

    if (subscriptions && subscriptions.has(symbol)) {
      client.send(message);
    }
  });
};

const broadcastUserEvent = (userId, event, data) => {
  if (!wss || !userId) {
    return;
  }

  const message = JSON.stringify({
    event,
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    if (clientUsers.get(client) !== String(userId)) {
      return;
    }

    client.send(message);
  });
};

const broadcastMarketStatus = () => {
  if (!wss) {
    return;
  }

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

const getWebSocketDiagnostics = () => ({
  clientCount: wss ? wss.clients.size : 0,
  subscriptionCount: clientSubscriptions.size,
  userCount: clientUsers.size,
});

module.exports = {
  initWebSocketServer,
  broadcastPrice,
  broadcastUserEvent,
  broadcastMarketStatus,
  closeWebSocketServer,
  getWebSocketDiagnostics,
};
