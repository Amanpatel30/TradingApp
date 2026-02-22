const WebSocket = require('ws');
const { updatePrice } = require('../state/market.state');
const { broadcastPrice } = require('../websocket/ws.server');
const { checkAndExecuteOrders } = require('../modules/orders/services/matching-engine-service');


let ws;
let lastPrices = {};

const startBinanceStream = (symbols = []) => {
  if (!symbols.length) {
    console.log('No symbols provided to Binance stream');
    return;
  }

  const streams = symbols
    .map(symbol => `${symbol.toLowerCase()}@ticker`)
    .join('/');

  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('✅ Connected to Binance WebSocket');
  });

 ws.on('message', (data) => {
  const parsed = JSON.parse(data);

  if (!parsed.data) return;

  const ticker = parsed.data;

  const symbol = ticker.s;

  const marketData = {
    symbol,
    price: parseFloat(ticker.c),
    open: parseFloat(ticker.o),
    high: parseFloat(ticker.h),
    low: parseFloat(ticker.l),
    volume: parseFloat(ticker.v),
    changePercent: parseFloat(ticker.P),
    timestamp: new Date(),
  };

  updatePrice(symbol, marketData);

  console.log(`📊 ${symbol} → ${marketData.price}`);

  broadcastPrice(symbol, marketData);
  
  // ── Execute Matching Engine ────────────────────────────────────
  checkAndExecuteOrders(symbol, marketData.price).catch(err => {
    console.error(`Matching Engine Error for ${symbol}:`, err.message);
  });
});


  ws.on('close', () => {
    console.log('❌ Binance disconnected. Reconnecting...');
    setTimeout(() => startBinanceStream(symbols), 5000);
  });

  ws.on('error', (err) => {
    console.error('Binance WS error:', err.message);
  });
};

module.exports = { startBinanceStream };
