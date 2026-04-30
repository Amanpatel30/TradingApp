const { BadRequestError } = require('../../../utils/custom-error');

const BINANCE_SPOT_BASE_URL = 'https://api.binance.com';
const SUPPORTED_INTERVALS = new Set(['1m', '5m', '15m', '1h', '4h', '1d', '1w']);

const toJson = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || `Binance request failed (${response.status})`);
  }

  return payload;
};

const formatTimeLabel = (timestamp, interval) => {
  const date = new Date(timestamp);
  const month = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();

  if (interval === '1w') {
    return `${month} W${Math.ceil(day / 7)}`;
  }

  if (interval === '1d') {
    return `${month} ${day}`;
  }

  if (interval === '1h' || interval === '4h') {
    return `${month} ${String(date.getUTCHours()).padStart(2, '0')}:00`;
  }

  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(
    date.getUTCMinutes()
  ).padStart(2, '0')}`;
};

const computeRsiSeries = (candles, period = 14) => {
  if (candles.length < 2) {
    return [];
  }

  const closes = candles.map((candle) => Number(candle.close || 0));
  const changes = closes.slice(1).map((close, index) => close - closes[index]);
  const series = [];

  let averageGain =
    changes.slice(0, period).reduce((sum, change) => sum + (change > 0 ? change : 0), 0) /
    period;
  let averageLoss =
    changes.slice(0, period).reduce((sum, change) => sum + (change < 0 ? Math.abs(change) : 0), 0) /
    period;

  changes.forEach((change, index) => {
    if (index >= period) {
      averageGain = (averageGain * (period - 1) + (change > 0 ? change : 0)) / period;
      averageLoss =
        (averageLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    }

    const rs = averageLoss === 0 ? 100 : averageGain / averageLoss;
    const rsi = 100 - 100 / (1 + rs);

    if (index >= period - 1) {
      series.push({
        t: candles[index + 1].time,
        rsi: Number(rsi.toFixed(1)),
      });
    }
  });

  return series.slice(-24);
};

const getMarketOverview = async (options = {}) => {
  const symbol = String(options.symbol || 'BTCUSDT').replace('/', '').toUpperCase();
  const interval = String(options.interval || '4h').toLowerCase();
  const limit = Math.min(120, Math.max(24, Number(options.limit || 52)));

  if (!SUPPORTED_INTERVALS.has(interval)) {
    throw new BadRequestError('Unsupported market interval');
  }

  const [klines, depth, trades] = await Promise.all([
    fetch(
      `${BINANCE_SPOT_BASE_URL}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    ).then(toJson),
    fetch(`${BINANCE_SPOT_BASE_URL}/api/v3/depth?symbol=${symbol}&limit=5`).then(toJson),
    fetch(`${BINANCE_SPOT_BASE_URL}/api/v3/trades?symbol=${symbol}&limit=8`).then(toJson),
  ]);

  const candles = klines.map((row) => ({
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
    time: formatTimeLabel(row[0], interval),
    openTime: row[0],
  }));

  const latestCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2] || latestCandle;
  const changePercent = previousCandle?.close
    ? ((Number(latestCandle.close) - Number(previousCandle.close)) / Number(previousCandle.close)) *
      100
    : 0;

  return {
    symbol,
    interval,
    candles,
    marketSnapshot: {
      symbol,
      price: Number(latestCandle?.close || 0),
      high: Number(latestCandle?.high || 0),
      low: Number(latestCandle?.low || 0),
      volume: Number(latestCandle?.volume || 0),
      changePercent: Number(changePercent.toFixed(2)),
    },
    orderBook: {
      asks: (depth.asks || []).map(([price, size], index) => ({
        price: Number(price),
        size: Number(size),
        depthPct: Math.max(18, 70 - index * 10),
      })),
      bids: (depth.bids || []).map(([price, size], index) => ({
        price: Number(price),
        size: Number(size),
        depthPct: Math.max(18, 70 - index * 10),
      })),
    },
    sales: (trades || []).map((trade) => ({
      id: trade.id,
      price: Number(trade.price),
      size: Number(trade.qty),
      up: !trade.isBuyerMaker,
      time: new Date(trade.time).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      }),
    })),
    rsiData: computeRsiSeries(candles),
    volumeData: candles.slice(-24).map((candle) => ({
      t: candle.time,
      vol: Number(candle.volume || 0),
      up: Number(candle.close) >= Number(candle.open),
    })),
  };
};

module.exports = {
  getMarketOverview,
};
