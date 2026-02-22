const WebSocket = require('ws');
const { getPrice } = require('../state/market.state');

let wss;

// Store subscriptions per client
// ws → Set of subscribed symbols
const clientSubscriptions = new Map();

const initWebSocketServer = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Client connected');

    // Initialize empty subscription set
    clientSubscriptions.set(ws, new Set());

    ws.on('message', (message) => {
  try {
    const parsed = JSON.parse(message.toString());

    if (parsed.event === 'subscribe') {
      const symbol = parsed.symbol?.toUpperCase();
      if (!symbol) return;

      const latest = getPrice(symbol);

      // ❌ If symbol not supported
      if (!latest) {
        ws.send(JSON.stringify({
          event: 'error',
          message: `Symbol ${symbol} is not supported`
        }));
        return;
      }

      clientSubscriptions.get(ws).add(symbol);

      console.log(`Client subscribed to ${symbol}`);

      // ✅ Send latest price immediately
      ws.send(JSON.stringify({
        event: 'price_update',
        data: latest
      }));
    }

    if (parsed.event === 'unsubscribe') {
      const symbol = parsed.symbol?.toUpperCase();
      if (!symbol) return;

      clientSubscriptions.get(ws).delete(symbol);

      console.log(`Client unsubscribed from ${symbol}`);
    }

  } catch (err) {
    console.error('Invalid WS message:', err.message);
  }
});



    ws.on('close', () => {
      console.log('🔴 Client disconnected');
      clientSubscriptions.delete(ws);
    });
  });

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

module.exports = {
  initWebSocketServer,
  broadcastPrice,
};
