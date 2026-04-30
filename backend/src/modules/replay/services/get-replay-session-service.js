const Asset = require('../../../schema/asset.model');
const MarketCandle = require('../../../schema/market-candle.model');
const ReplaySession = require('../../../schema/replay-session.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { ensureReplayCandles } = require('./sync-replay-candles-service');

const MISTAKE_SCORES = {
  'Early Entry': 12,
  Overtrading: 18,
  'Stop Moved': 20,
  'Risk Too High': 16,
};

const buildCoachFeedback = (trades) => {
  if (!trades.length) {
    return [
      {
        id: 'coach-empty-1',
        tradeNum: 0,
        type: 'good',
        color: '#22C55E',
        message: 'Start a replay trade to get coaching feedback on your execution.',
      },
    ];
  }

  return trades.map((trade, index) => ({
    id: `coach-${index + 1}`,
    tradeNum: index + 1,
    type: trade.mistake ? 'warning' : 'good',
    color: trade.mistake ? '#F59E0B' : '#22C55E',
    message: trade.mistake
      ? `${trade.mistake} detected on replay trade #${index + 1}. Review position sizing, timing, and stop discipline.`
      : `Replay trade #${index + 1} respected the plan and closed cleanly.`,
  }));
};

const getReplaySession = async (userId, options = {}) => {
  const symbol = String(options.symbol || 'BTCUSDT').replace('/', '').toUpperCase();
  const year = String(options.year || '2025');
  const timeframe = String(options.timeframe || '4H');

  const [assets, years, timeframes, replayMarket, session] = await Promise.all([
    Asset.find({ isActive: true }).sort({ symbol: 1 }).lean(),
    MarketCandle.distinct('year'),
    MarketCandle.distinct('timeframe'),
    ensureReplayCandles({ symbol, year, timeframe }),
    ReplaySession.findOne({ user: userId, symbol, year, timeframe }).lean(),
  ]);
  const marketDoc = replayMarket?.marketDoc;

  if (!marketDoc) {
    throw new BadRequestError('Replay candles not found for the selected market');
  }

  const trades = (session?.trades || []).map((trade) => ({
    id: String(trade._id),
    side: trade.side,
    entry: `$${Math.round(trade.entry).toLocaleString()}`,
    exit: `$${Math.round(trade.exit).toLocaleString()}`,
    pnl: `${trade.pnl >= 0 ? '+' : '-'}$${Math.abs(Math.round(trade.pnl)).toLocaleString()}`,
    ok: trade.ok,
    mistake: trade.mistake || null,
  }));

  const tradeMarkers = trades.map((trade, index) => ({
    candleIdx: 14 + index * 9,
    type: index % 2 === 0 ? 'entry' : 'exit',
    label: trade.ok ? `Exit ${trade.pnl}` : `Exit ${trade.pnl}`,
    color: trade.ok ? '#22C55E' : '#EF4444',
    side: trade.side,
  }));

  const mistakeMarkers = trades
    .filter((trade) => trade.mistake)
    .map((trade, index) => ({
      candleIdx: 18 + index * 11,
      type: 'warning',
      label: `⚠ ${trade.mistake}`,
      color: '#F59E0B',
    }));

  const sessionStats = {
    trades: trades.length,
    wins: trades.filter((trade) => trade.ok).length,
    pnl: Math.round(
      (session?.trades || []).reduce((sum, trade) => sum + Number(trade.pnl || 0), 0)
    ),
  };

  const totalPenalty = trades.reduce(
    (sum, trade) => sum + (trade.mistake ? MISTAKE_SCORES[trade.mistake] || 8 : 0),
    0
  );

  return {
    selected: { symbol, year, timeframe },
    options: {
      assets: assets.map((asset) => `${asset.baseAsset}/${asset.quoteAsset}`),
      years: years.sort(),
      timeframes: timeframes.sort(),
    },
    candles: marketDoc.candles || [],
    sessionTrades: trades,
    coachFeedback: buildCoachFeedback(session?.trades || []),
    tradeMarkers,
    mistakeMarkers,
    sessionStats,
    sessionScore: Math.max(40, 92 - totalPenalty),
    marketMeta: replayMarket?.sourceMeta || {
      source: marketDoc.source || 'UNKNOWN',
      fallbackUsed: false,
      lastSyncedAt: marketDoc.lastSyncedAt || null,
    },
  };
};

module.exports = {
  getReplaySession,
};
