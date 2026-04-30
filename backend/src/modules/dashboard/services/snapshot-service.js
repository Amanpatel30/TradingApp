const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const PortfolioSnapshot = require('../../../schema/portfolio-snapshot.model');
const MarketSnapshot = require('../../../schema/market-snapshot.model');
const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const { getPrice } = require('../../../state/market.state');

const DEFAULT_STARTING_CAPITAL = 10000;
const SNAPSHOT_HISTORY_MONTHS = 36;
const DEFAULT_WINDOW_KEY = '15M';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WINDOW_OPTIONS = [
  { key: '6M', label: '6M', months: 6 },
  { key: '12M', label: '12M', months: 12 },
  { key: '15M', label: '15M', months: 15 },
  { key: '24M', label: '24M', months: 24 },
  { key: 'MAX', label: 'Max', months: null },
];

const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const monthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

const toMonthStart = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const shiftMonth = (date, delta) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1));

const buildTimeline = ({ months = SNAPSHOT_HISTORY_MONTHS, endDate = new Date() } = {}) => {
  const end = toMonthStart(endDate);
  const timeline = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    timeline.push(shiftMonth(end, -index));
  }

  return timeline;
};

const buildMonthLabel = (date, previousDate) => {
  if (!previousDate || previousDate.getUTCFullYear() !== date.getUTCFullYear()) {
    const yearSuffix = String(date.getUTCFullYear()).slice(-2);
    return `${MONTH_NAMES[date.getUTCMonth()]}'${yearSuffix}`;
  }

  return MONTH_NAMES[date.getUTCMonth()];
};

const resolveWindowMonths = (windowKey, availablePoints) => {
  const option = WINDOW_OPTIONS.find(({ key }) => key === windowKey) ||
    WINDOW_OPTIONS.find(({ key }) => key === DEFAULT_WINDOW_KEY);

  if (!option || option.months == null) {
    return availablePoints;
  }

  return Math.min(option.months, availablePoints);
};

const sliceForWindow = (items, windowKey) => {
  const months = resolveWindowMonths(windowKey, items.length);
  return items.slice(-months);
};

const calculateSeriesDrawdown = (series) => {
  let peak = null;

  return series.map((point) => {
    if (peak === null || point.portfolioValue > peak) {
      peak = point.portfolioValue;
    }

    const drawdown = peak ? ((point.portfolioValue - peak) / peak) * 100 : 0;

    return {
      ...point,
      drawdown: round(drawdown, 1),
    };
  });
};

const fetchMonthlyKlines = async (symbol, months) => {
  const endpoint = new URL('https://api.binance.com/api/v3/klines');
  endpoint.searchParams.set('symbol', symbol);
  endpoint.searchParams.set('interval', '1M');
  endpoint.searchParams.set('limit', String(months));

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Binance klines request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('Unexpected Binance klines payload');
  }

  return payload;
};

const buildLiveFallbackMarketSnapshots = (symbol, months) => {
  const timeline = buildTimeline({ months });
  const liveMarket = getPrice(symbol);
  const livePrice = Number(liveMarket?.price || 0);

  if (!livePrice) {
    return [];
  }

  return timeline.map((periodStart) => ({
    symbol,
    periodStart,
    periodType: 'MONTHLY',
    openPrice: livePrice,
    highPrice: livePrice,
    lowPrice: livePrice,
    closePrice: livePrice,
    volume: Number(liveMarket?.volume || 0),
    quoteVolume: 0,
    tradeCount: 0,
    changePercent: 0,
    source: 'LIVE_STATE_FALLBACK',
  }));
};

const ensureMarketSnapshots = async (
  symbol = 'BTCUSDT',
  { months = SNAPSHOT_HISTORY_MONTHS } = {}
) => {
  const timeline = buildTimeline({ months });
  const existingSnapshots = await MarketSnapshot.find({
    symbol,
    periodType: 'MONTHLY',
    periodStart: {
      $gte: timeline[0],
      $lte: timeline[timeline.length - 1],
    },
  })
    .sort({ periodStart: 1 })
    .lean();

  const currentMonth = monthKey(timeline[timeline.length - 1]);
  const currentSnapshot = existingSnapshots.find(
    (snapshot) => monthKey(new Date(snapshot.periodStart)) === currentMonth
  );
  const currentSnapshotAgeMs = currentSnapshot?.updatedAt
    ? Date.now() - new Date(currentSnapshot.updatedAt).getTime()
    : Number.POSITIVE_INFINITY;
  const snapshotsAreFresh =
    existingSnapshots.length === timeline.length &&
    currentSnapshot &&
    currentSnapshotAgeMs < 6 * 60 * 60 * 1000 &&
    existingSnapshots.every((snapshot) => snapshot.source === 'BINANCE_KLINES');

  if (snapshotsAreFresh) {
    return existingSnapshots;
  }

  let snapshotsToPersist = [];

  try {
    const klines = await fetchMonthlyKlines(symbol, months);

    snapshotsToPersist = klines.map((kline) => {
      const periodStart = new Date(Number(kline[0]));
      const openPrice = Number(kline[1] || 0);
      const highPrice = Number(kline[2] || 0);
      const lowPrice = Number(kline[3] || 0);
      const closePrice = Number(kline[4] || 0);
      const volume = Number(kline[5] || 0);
      const quoteVolume = Number(kline[7] || 0);
      const tradeCount = Number(kline[8] || 0);
      const changePercent = openPrice
        ? ((closePrice - openPrice) / openPrice) * 100
        : 0;

      return {
        symbol,
        periodStart: toMonthStart(periodStart),
        periodType: 'MONTHLY',
        openPrice: round(openPrice, 2),
        highPrice: round(highPrice, 2),
        lowPrice: round(lowPrice, 2),
        closePrice: round(closePrice, 2),
        volume: round(volume, 8),
        quoteVolume: round(quoteVolume, 2),
        tradeCount,
        changePercent: round(changePercent, 2),
        source: 'BINANCE_KLINES',
      };
    });
  } catch (error) {
    snapshotsToPersist = existingSnapshots.length
      ? existingSnapshots
      : buildLiveFallbackMarketSnapshots(symbol, months);
  }

  for (const snapshot of snapshotsToPersist) {
    await MarketSnapshot.findOneAndUpdate(
      {
        symbol: snapshot.symbol,
        periodStart: snapshot.periodStart,
        periodType: snapshot.periodType,
      },
      {
        $set: {
          openPrice: snapshot.openPrice,
          highPrice: snapshot.highPrice,
          lowPrice: snapshot.lowPrice,
          closePrice: snapshot.closePrice,
          volume: snapshot.volume,
          quoteVolume: snapshot.quoteVolume,
          tradeCount: snapshot.tradeCount,
          changePercent: snapshot.changePercent,
          source: snapshot.source,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  return MarketSnapshot.find({
    symbol,
    periodType: 'MONTHLY',
    periodStart: {
      $gte: timeline[0],
      $lte: timeline[timeline.length - 1],
    },
  })
    .sort({ periodStart: 1 })
    .lean();
};

const rebuildUserPortfolioSnapshots = async (
  userId,
  { months = SNAPSHOT_HISTORY_MONTHS } = {}
) => {
  const user = await User.findById(userId);
  if (!user) {
    return [];
  }

  const portfolio = await getPortfolio(userId);
  const orders = await Order.find({
    user: userId,
    status: 'FILLED',
  })
    .sort({ createdAt: 1 })
    .lean();

  const timeline = buildTimeline({ months });
  const realizedByMonth = {};

  orders.forEach((order) => {
    const key = monthKey(toMonthStart(new Date(order.createdAt)));
    realizedByMonth[key] = (realizedByMonth[key] || 0) + Number(order.realizedPnL || 0);
  });

  const currentMonthKey = monthKey(timeline[timeline.length - 1]);
  const currentPortfolioValue = Number(
    portfolio.totalPortfolioValue || DEFAULT_STARTING_CAPITAL
  );
  const currentRealized = Number(portfolio.totalRealizedPnL || 0);
  const currentUnrealized = Number(portfolio.totalUnrealizedPnL || 0);
  const netProfit = currentRealized + currentUnrealized;
  const startingCapital = Math.max(
    DEFAULT_STARTING_CAPITAL,
    round(currentPortfolioValue - netProfit, 2)
  );

  let cumulativeRealized = 0;

  const rawSnapshots = timeline.map((periodStart, index) => {
    const key = monthKey(periodStart);
    cumulativeRealized += Number(realizedByMonth[key] || 0);

    const unrealizedPnL = key === currentMonthKey ? currentUnrealized : 0;
    const periodNetProfit = cumulativeRealized + unrealizedPnL;
    const portfolioValue = startingCapital + periodNetProfit;

    return {
      user: user._id,
      periodStart,
      periodType: 'MONTHLY',
      label: buildMonthLabel(periodStart, timeline[index - 1]),
      portfolioValue: round(portfolioValue, 2),
      realizedPnL: round(cumulativeRealized, 2),
      unrealizedPnL: round(unrealizedPnL, 2),
      netProfit: round(periodNetProfit, 2),
      monthlyReturn: 0,
      drawdown: 0,
    };
  });

  const withReturns = rawSnapshots.map((snapshot, index) => {
    if (index === 0) {
      return snapshot;
    }

    const previousValue =
      rawSnapshots[index - 1].portfolioValue || DEFAULT_STARTING_CAPITAL;
    const monthlyReturn = previousValue
      ? ((snapshot.portfolioValue - previousValue) / previousValue) * 100
      : 0;

    return {
      ...snapshot,
      monthlyReturn: round(monthlyReturn, 1),
    };
  });

  const finalizedSnapshots = calculateSeriesDrawdown(withReturns);

  for (const snapshot of finalizedSnapshots) {
    await PortfolioSnapshot.findOneAndUpdate(
      {
        user: snapshot.user,
        periodStart: snapshot.periodStart,
        periodType: snapshot.periodType,
      },
      {
        $set: {
          label: snapshot.label,
          portfolioValue: snapshot.portfolioValue,
          realizedPnL: snapshot.realizedPnL,
          unrealizedPnL: snapshot.unrealizedPnL,
          netProfit: snapshot.netProfit,
          monthlyReturn: snapshot.monthlyReturn,
          drawdown: snapshot.drawdown,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  return PortfolioSnapshot.find({
    user: userId,
    periodType: 'MONTHLY',
    periodStart: {
      $gte: timeline[0],
      $lte: timeline[timeline.length - 1],
    },
  })
    .sort({ periodStart: 1 })
    .lean();
};

module.exports = {
  DEFAULT_STARTING_CAPITAL,
  SNAPSHOT_HISTORY_MONTHS,
  DEFAULT_WINDOW_KEY,
  WINDOW_OPTIONS,
  MONTH_NAMES,
  monthKey,
  toMonthStart,
  buildTimeline,
  buildMonthLabel,
  resolveWindowMonths,
  sliceForWindow,
  ensureMarketSnapshots,
  rebuildUserPortfolioSnapshots,
};
