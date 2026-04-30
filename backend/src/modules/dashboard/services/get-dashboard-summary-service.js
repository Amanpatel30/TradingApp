const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const PortfolioSnapshot = require('../../../schema/portfolio-snapshot.model');
const MarketSnapshot = require('../../../schema/market-snapshot.model');
const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const { BadRequestError } = require('../../../utils/custom-error');
const {
  monthKey,
  MONTH_NAMES,
  SNAPSHOT_HISTORY_MONTHS,
  DEFAULT_WINDOW_KEY,
  WINDOW_OPTIONS,
  sliceForWindow,
  ensureMarketSnapshots,
  rebuildUserPortfolioSnapshots,
} = require('./snapshot-service');

const formatCurrency = (value, digits = 0) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

const formatSignedCurrency = (value, digits = 0) =>
  `${Number(value || 0) >= 0 ? '+' : '-'}${formatCurrency(Math.abs(value || 0), digits)}`;

const calculateSharpeRatio = (returns) => {
  const activeReturns = returns.filter((value) => value !== 0);
  if (!activeReturns.length) {
    return 0;
  }

  const mean =
    activeReturns.reduce((sum, value) => sum + value, 0) / activeReturns.length;
  const variance =
    activeReturns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    activeReturns.length;
  const standardDeviation = Math.sqrt(variance);

  if (standardDeviation === 0) {
    return mean > 0 ? 3 : 0;
  }

  return (mean / standardDeviation) * Math.sqrt(12);
};

const sameUtcDay = (left, right) =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth() &&
  left.getUTCDate() === right.getUTCDate();

const utcDayDifference = (left, right) => {
  const leftDay = Date.UTC(left.getUTCFullYear(), left.getUTCMonth(), left.getUTCDate());
  const rightDay = Date.UTC(right.getUTCFullYear(), right.getUTCMonth(), right.getUTCDate());
  return Math.round((leftDay - rightDay) / (24 * 60 * 60 * 1000));
};

const sameUtcMonth = (left, right) =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth();

const buildRangeLabel = (snapshots) => {
  if (!snapshots.length) {
    return '';
  }

  const first = new Date(snapshots[0].periodStart);
  const last = new Date(snapshots[snapshots.length - 1].periodStart);

  return `${MONTH_NAMES[first.getUTCMonth()]} ${first.getUTCFullYear()} – ${MONTH_NAMES[last.getUTCMonth()]} ${last.getUTCFullYear()}`;
};

const buildMonthlyReturns = (snapshots) => {
  const returnsByYear = {};

  snapshots.forEach((snapshot) => {
    const date = new Date(snapshot.periodStart);
    const year = String(date.getUTCFullYear());

    if (!returnsByYear[year]) {
      returnsByYear[year] = new Array(12).fill(0);
    }

    returnsByYear[year][date.getUTCMonth()] = Number(snapshot.monthlyReturn || 0);
  });

  return returnsByYear;
};

const buildRecentTrades = (orders, latestPrices) =>
  orders.slice(0, 6).map((order) => {
    const entryPrice = Number(order.price || 0);
    const exitPrice =
      order.side === 'SELL'
        ? Number(order.price || 0)
        : Number(latestPrices[order.symbol] || order.price || 0);
    const pnlValue =
      order.side === 'SELL'
        ? Number(order.realizedPnL || 0)
        : (exitPrice - entryPrice) * Number(order.quantity || 0);

    return {
      asset: order.symbol.replace('USDT', '/USDT'),
      side: order.side === 'BUY' ? 'Long' : 'Short',
      entry: formatCurrency(entryPrice),
      exit: formatCurrency(exitPrice),
      profit: formatSignedCurrency(pnlValue),
      strategy: order.strategy || 'Unlabeled',
      profitable: pnlValue >= 0,
    };
  });

const buildSessionBadge = (orders) => {
  if (!orders.length) {
    return { label: 'No Session', tone: 'neutral' };
  }

  const latestTradeDate = new Date(orders[0].createdAt);
  const now = new Date();
  const diffDays = utcDayDifference(now, latestTradeDate);

  if (diffDays === 0) {
    return { label: 'Today', tone: 'success' };
  }

  if (diffDays === 1) {
    return { label: 'Yesterday', tone: 'info' };
  }

  if (diffDays < 7) {
    return { label: 'This Week', tone: 'info' };
  }

  if (
    latestTradeDate.getUTCFullYear() === now.getUTCFullYear() &&
    latestTradeDate.getUTCMonth() === now.getUTCMonth()
  ) {
    return { label: 'This Month', tone: 'warn' };
  }

  return {
    label: `${MONTH_NAMES[latestTradeDate.getUTCMonth()]} ${latestTradeDate.getUTCFullYear()}`,
    tone: 'neutral',
  };
};

const buildSessionSummary = (orders) => {
  if (!orders.length) {
    return {
      badge: 'No Session',
      badgeTone: 'neutral',
      metrics: [
        { label: 'Trades', value: '0', color: '#3B82F6' },
        { label: 'Win Rate', value: '0.0%', color: '#22C55E' },
        { label: 'Session P&L', value: '+$0', color: '#22C55E' },
        { label: 'Mistakes', value: '0', color: '#F59E0B' },
        { label: 'Main Issue', value: 'No closed trades', color: '#EF4444' },
      ],
      score: 55,
    };
  }

  const latestTradeDate = new Date(orders[0].createdAt);
  const badge = buildSessionBadge(orders);
  const sessionOrders = orders
    .filter((order) => {
      const orderDate = new Date(order.createdAt);

      if (badge.label === 'Today' || badge.label === 'Yesterday') {
        return sameUtcDay(orderDate, latestTradeDate);
      }

      if (badge.label === 'This Week') {
        const diff = utcDayDifference(latestTradeDate, orderDate);
        return diff >= 0 && diff < 7;
      }

      return sameUtcMonth(orderDate, latestTradeDate);
    })
    .slice(0, 10);
  const closedOrders = sessionOrders.filter(
    (order) => order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0
  );
  const winningOrders = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) > 0
  );
  const totalPnl = closedOrders.reduce(
    (sum, order) => sum + Number(order.realizedPnL || 0),
    0
  );
  const winRate = closedOrders.length
    ? (winningOrders.length / closedOrders.length) * 100
    : 0;
  const mistakes = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) < 0
  ).length;
  const mainIssue = closedOrders.length
    ? mistakes
      ? 'Review exits'
      : 'Execution solid'
    : 'No closed trades';
  const score = Math.max(
    55,
    Math.min(
      98,
      Math.round(
        60 +
          winRate * 0.3 +
          (totalPnl > 0 ? 8 : totalPnl < 0 ? -8 : 0) -
          mistakes * 6
      )
    )
  );
  return {
    badge: badge.label,
    badgeTone: badge.tone,
    metrics: [
      { label: 'Trades', value: String(sessionOrders.length), color: '#3B82F6' },
      { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: '#22C55E' },
      {
        label: 'Session P&L',
        value: formatSignedCurrency(totalPnl),
        color: totalPnl >= 0 ? '#22C55E' : '#EF4444',
      },
      { label: 'Mistakes', value: String(mistakes), color: '#F59E0B' },
      { label: 'Main Issue', value: mainIssue, color: '#EF4444' },
    ],
    score,
  };
};

const buildRightMetrics = (orders, portfolioValue) => {
  const closedOrders = orders.filter(
    (order) => order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0
  );
  const winningOrders = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) > 0
  );
  const losingOrders = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) < 0
  );
  const grossProfit = winningOrders.reduce(
    (sum, order) => sum + Number(order.realizedPnL || 0),
    0
  );
  const grossLoss = losingOrders.reduce(
    (sum, order) => sum + Math.abs(Number(order.realizedPnL || 0)),
    0
  );
  const averageWin = winningOrders.length ? grossProfit / winningOrders.length : 0;
  const averageLoss = losingOrders.length
    ? losingOrders.reduce(
        (sum, order) => sum + Number(order.realizedPnL || 0),
        0
      ) / losingOrders.length
    : 0;
  const largestWin = winningOrders.length
    ? Math.max(...winningOrders.map((order) => Number(order.realizedPnL || 0)))
    : 0;
  const largestLoss = losingOrders.length
    ? Math.min(...losingOrders.map((order) => Number(order.realizedPnL || 0)))
    : 0;
  const expectancy = closedOrders.length
    ? closedOrders.reduce(
        (sum, order) => sum + Number(order.realizedPnL || 0),
        0
      ) / closedOrders.length
    : 0;
  const riskPerTrade = portfolioValue
    ? (Math.abs(expectancy) / portfolioValue) * 100
    : 0;

  return [
    { label: 'Average Win', value: formatSignedCurrency(averageWin), color: '#16C784' },
    { label: 'Average Loss', value: formatSignedCurrency(averageLoss), color: '#EA3943' },
    { label: 'Risk per Trade', value: `${riskPerTrade.toFixed(2)}%`, color: '#6B7280' },
    { label: 'Largest Win', value: formatSignedCurrency(largestWin), color: '#16C784' },
    { label: 'Largest Loss', value: formatSignedCurrency(largestLoss), color: '#EA3943' },
    { label: 'Trade Expectancy', value: formatSignedCurrency(expectancy), color: '#3B82F6' },
  ];
};

const buildStatCards = ({
  portfolioValue,
  netProfit,
  realizedPnL,
  orders,
  snapshotReturns,
  maxDrawdown,
  firstSnapshotValue,
  snapshotCount,
}) => {
  const closedOrders = orders.filter(
    (order) => order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0
  );
  const winningOrders = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) > 0
  );
  const losingOrders = closedOrders.filter(
    (order) => Number(order.realizedPnL || 0) < 0
  );
  const grossProfit = winningOrders.reduce(
    (sum, order) => sum + Number(order.realizedPnL || 0),
    0
  );
  const grossLoss = losingOrders.reduce(
    (sum, order) => sum + Math.abs(Number(order.realizedPnL || 0)),
    0
  );
  const winRate = closedOrders.length
    ? (winningOrders.length / closedOrders.length) * 100
    : 0;
  const profitFactor = grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 0;
  const totalReturnPercent = firstSnapshotValue
    ? (netProfit / firstSnapshotValue) * 100
    : 0;
  const sharpeRatio = calculateSharpeRatio(snapshotReturns);

  return [
    {
      label: 'Portfolio Value',
      value: formatCurrency(portfolioValue),
      change: formatSignedCurrency(netProfit),
      pct: `${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(1)}%`,
      up: netProfit >= 0,
      color: '#3B82F6',
    },
    {
      label: 'Net Profit',
      value: formatSignedCurrency(netProfit),
      change: formatSignedCurrency(realizedPnL),
      pct: 'realized + unrealized',
      up: netProfit >= 0,
      color: '#16C784',
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      change: `${winningOrders.length}/${closedOrders.length}`,
      pct: 'closed profitable trades',
      up: winRate >= 50,
      color: '#8B5CF6',
    },
    {
      label: 'Profit Factor',
      value: profitFactor.toFixed(2),
      change: formatCurrency(grossProfit),
      pct: grossLoss ? `${formatSignedCurrency(-grossLoss)} losses` : 'no realized losses',
      up: profitFactor >= 1,
      color: '#F59E0B',
    },
    {
      label: 'Max Drawdown',
      value: `${Number(maxDrawdown || 0).toFixed(1)}%`,
      change: `${snapshotCount} data points`,
      pct: 'equity curve',
      up: Number(maxDrawdown || 0) >= -10,
      color: '#EA3943',
    },
    {
      label: 'Sharpe Ratio',
      value: sharpeRatio.toFixed(2),
      change: formatSignedCurrency(realizedPnL),
      pct: 'approx. risk-adjusted return',
      up: sharpeRatio >= 0,
      color: '#16C784',
    },
  ];
};

const buildChartConfig = ({
  portfolioData,
  selectedWindow,
  benchmarkSource,
}) => {
  const drawdownValues = portfolioData.map((point) => Number(point.drawdown || 0));
  const minDrawdown = drawdownValues.length ? Math.min(...drawdownValues) : 0;
  const drawdownFloor = minDrawdown < 0 ? Math.floor((minDrawdown - 1) / 5) * 5 : -5;
  const referenceMarkers = portfolioData
    .filter((point, index) => {
      const date = new Date(point.periodStart);
      return index === 0 || date.getUTCMonth() === 0;
    })
    .map((point) => ({
      key: point.key,
      label: point.date,
    }));

  return {
    selectedWindow,
    availableWindows: WINDOW_OPTIONS.map(({ key, label }) => ({ key, label })),
    drawdownDomain: [drawdownFloor, 5],
    referenceMarkers,
    benchmark: {
      symbol: 'BTCUSDT',
      source: benchmarkSource || 'UNKNOWN',
    },
    series: {
      portfolio: {
        label: 'Portfolio',
        color: '#3B82F6',
        fill: '#3B82F6',
        fillOpacity: 0.08,
      },
      benchmark: {
        label: 'BTC Benchmark',
        color: '#F59E0B',
        strokeDasharray: '5 3',
      },
      drawdown: {
        label: 'Drawdown',
        color: '#EF4444',
        fill: '#EF4444',
        fillOpacity: 0.1,
      },
    },
  };
};

const getDashboardSummary = async (userId, { window = DEFAULT_WINDOW_KEY } = {}) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new BadRequestError('User not found');
  }

  await ensureMarketSnapshots('BTCUSDT', {
    months: SNAPSHOT_HISTORY_MONTHS,
  });
  await rebuildUserPortfolioSnapshots(userId, {
    months: SNAPSHOT_HISTORY_MONTHS,
  });

  const [portfolio, orders, allPortfolioSnapshots, allMarketSnapshots] = await Promise.all([
    getPortfolio(userId),
    Order.find({
      user: userId,
      status: 'FILLED',
    })
      .sort({ createdAt: -1 })
      .lean(),
    PortfolioSnapshot.find({
      user: userId,
      periodType: 'MONTHLY',
    })
      .sort({ periodStart: 1 })
      .lean(),
    MarketSnapshot.find({
      symbol: 'BTCUSDT',
      periodType: 'MONTHLY',
    })
      .sort({ periodStart: 1 })
      .lean(),
  ]);

  const selectedWindow = WINDOW_OPTIONS.some(({ key }) => key === window)
    ? window
    : DEFAULT_WINDOW_KEY;
  const portfolioSnapshots = sliceForWindow(allPortfolioSnapshots, selectedWindow);
  const portfolioKeys = new Set(
    portfolioSnapshots.map((snapshot) => monthKey(new Date(snapshot.periodStart)))
  );
  const marketSnapshots = allMarketSnapshots.filter((snapshot) =>
    portfolioKeys.has(monthKey(new Date(snapshot.periodStart)))
  );
  const firstPortfolioSnapshot = portfolioSnapshots[0];
  const firstMarketSnapshot = marketSnapshots[0];
  const latestPrices = Object.fromEntries(
    portfolio.assets.map((asset) => [
      asset.symbol,
      Number(asset.currentPrice || asset.avgBuyPrice || 0),
    ])
  );
  const marketSnapshotMap = new Map(
    marketSnapshots.map((snapshot) => [
      monthKey(new Date(snapshot.periodStart)),
      snapshot,
    ])
  );
  const benchmarkBase = Number(firstPortfolioSnapshot?.portfolioValue || 10000);
  const benchmarkPriceBase = Number(firstMarketSnapshot?.closePrice || 1);

  const portfolioData = portfolioSnapshots.map((snapshot) => {
    const snapshotKey = monthKey(new Date(snapshot.periodStart));
    const marketSnapshot = marketSnapshotMap.get(snapshotKey);
    const benchmark = marketSnapshot
      ? benchmarkBase *
        (Number(marketSnapshot.closePrice || benchmarkPriceBase) / benchmarkPriceBase)
      : benchmarkBase;

    return {
      date: snapshot.label,
      key: snapshotKey,
      periodStart: snapshot.periodStart,
      value: Number(snapshot.portfolioValue || 0),
      drawdown: Number(snapshot.drawdown || 0),
      benchmark: Number(benchmark.toFixed(2)),
    };
  });

  const monthlyReturns = buildMonthlyReturns(portfolioSnapshots);
  const snapshotReturns = portfolioSnapshots.map((snapshot) =>
    Number(snapshot.monthlyReturn || 0)
  );
  const maxDrawdown = portfolioSnapshots.reduce(
    (minValue, snapshot) => Math.min(minValue, Number(snapshot.drawdown || 0)),
    0
  );
  const netProfit =
    Number(portfolio.totalRealizedPnL || 0) +
    Number(portfolio.totalUnrealizedPnL || 0);

  return {
    selectedWindow,
    rangeLabel: buildRangeLabel(portfolioSnapshots),
    chartConfig: buildChartConfig({
      portfolioData,
      selectedWindow,
      benchmarkSource: marketSnapshots[marketSnapshots.length - 1]?.source,
    }),
    statCards: buildStatCards({
      portfolioValue: Number(portfolio.totalPortfolioValue || 0),
      netProfit,
      realizedPnL: Number(portfolio.totalRealizedPnL || 0),
      orders,
      snapshotReturns,
      maxDrawdown,
      firstSnapshotValue: Number(firstPortfolioSnapshot?.portfolioValue || 10000),
      snapshotCount: portfolioSnapshots.length,
    }),
    portfolioData,
    monthlyReturns,
    rightMetrics: buildRightMetrics(orders, Number(portfolio.totalPortfolioValue || 0)),
    sessionSummary: buildSessionSummary(orders),
    recentTrades: buildRecentTrades(orders, latestPrices),
    greeting: {
      name: user.name,
    },
    portfolioSummary: {
      totalPortfolioValue: portfolio.totalPortfolioValue,
      totalUnrealizedPnL: portfolio.totalUnrealizedPnL,
      totalRealizedPnL: portfolio.totalRealizedPnL,
      balances: portfolio.balances,
      assets: portfolio.assets,
    },
  };
};

module.exports = {
  getDashboardSummary,
};
