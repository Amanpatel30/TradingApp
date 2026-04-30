const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const JournalEntry = require('../../../schema/journal-entry.model');
const PortfolioSnapshot = require('../../../schema/portfolio-snapshot.model');
const MarketSnapshot = require('../../../schema/market-snapshot.model');
const { getPortfolio } = require('../../portfolio/services/get-portfolio-service');
const { monthKey } = require('../../dashboard/services/snapshot-service');

const EMOTION_ORDER = [
  'Confident',
  'Fearful',
  'Greedy',
  'Calm',
  'Anxious',
  'FOMO',
  'Patient',
  'Impulsive',
];

const CATEGORY_ORDER = [
  'Early Entry',
  'SL Too Tight',
  'FOMO Chase',
  'Overtrading',
  'No SL Set',
  'Trend Fade',
  'Size Too Large',
  'Moved SL',
];

const PERIOD_LABELS = {
  ALL_TIME: 'All Time',
  THIS_MONTH: 'This Month',
  THIS_WEEK: 'This Week',
  TODAY: 'Today',
};

const STRATEGY_FALLBACKS = [
  'Breakout',
  'RSI Reversal',
  'Trend Follow',
  'MA Cross',
  'Support Bounce',
  'VWAP',
];

const formatCurrency = (value, digits = 0) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

const formatSignedCurrency = (value, digits = 0) =>
  `${Number(value || 0) >= 0 ? '+' : '-'}${formatCurrency(
    Math.abs(Number(value || 0)),
    digits
  )}`;

const formatPercent = (value, digits = 1) =>
  `${Number(value || 0).toFixed(digits)}%`;

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const startOfUtcWeek = (date) => {
  const day = date.getUTCDay() || 7;
  const shifted = new Date(startOfUtcDay(date));
  shifted.setUTCDate(shifted.getUTCDate() - (day - 1));
  return shifted;
};

const startOfUtcMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const getPeriodStart = (period) => {
  const now = new Date();

  switch (period) {
    case 'TODAY':
      return startOfUtcDay(now);
    case 'THIS_WEEK':
      return startOfUtcWeek(now);
    case 'THIS_MONTH':
      return startOfUtcMonth(now);
    default:
      return null;
  }
};

const normalizePeriod = (period) => {
  const upper = String(period || 'ALL_TIME').replace(/\s+/g, '_').toUpperCase();
  return PERIOD_LABELS[upper] ? upper : 'ALL_TIME';
};

const orderDate = (order) => new Date(order.createdAt || order.updatedAt || Date.now());

const filterByPeriod = (items, getter, period) => {
  const normalized = normalizePeriod(period);
  const start = getPeriodStart(normalized);

  if (!start) {
    return items;
  }

  return items.filter((item) => getter(item) >= start);
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const average = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const inferEmotion = (order, existingEmotion) => {
  if (existingEmotion) {
    return existingEmotion;
  }

  const pnl = Number(order.realizedPnL || 0);
  if (pnl > 0) {
    const positive = ['Confident', 'Calm', 'Patient'];
    return positive[(order.symbol.length + Math.round(pnl)) % positive.length];
  }

  if (pnl < 0) {
    const negative = ['Anxious', 'FOMO', 'Impulsive', 'Fearful'];
    return negative[(order.symbol.length + Math.abs(Math.round(pnl))) % negative.length];
  }

  return 'Calm';
};

const inferMistakeType = (order, existingType, orderCountForDay = 0) => {
  if (existingType) {
    return existingType;
  }

  const pnl = Number(order.realizedPnL || 0);
  if (pnl >= 0) {
    return '';
  }

  if (orderCountForDay > 6) {
    return 'Overtrading';
  }

  if ((order.strategy || '').toLowerCase().includes('break')) {
    return 'Early Entry';
  }

  if ((order.strategy || '').toLowerCase().includes('vwap')) {
    return 'FOMO Chase';
  }

  if (Math.abs(pnl) > Number(order.total || 0) * 0.08) {
    return 'Size Too Large';
  }

  return CATEGORY_ORDER[(order.symbol.length + Math.abs(Math.round(pnl))) % CATEGORY_ORDER.length];
};

const inferMistakeText = (order, mistakeType, existingMistake) => {
  if (existingMistake) {
    return existingMistake;
  }

  if (!mistakeType) {
    return '';
  }

  const map = {
    'Early Entry': 'Entered before confirmation. Waiting for candle close would likely reduce false signals.',
    'SL Too Tight': 'The stop was likely inside normal volatility and left little room for the setup to develop.',
    'FOMO Chase': 'This trade looks like a chase after momentum instead of a planned entry at structure.',
    Overtrading: 'Trade frequency spiked during a weak stretch. Fewer, higher-quality setups would help.',
    'No SL Set': 'Risk was undefined at entry. A predefined stop should be part of the plan before execution.',
    'Trend Fade': 'This position fought the prevailing direction instead of aligning with the stronger move.',
    'Size Too Large': 'Position size appears too large relative to account risk and amplified the drawdown.',
    'Moved SL': 'Trade management likely changed after entry and reduced discipline.',
  };

  return map[mistakeType] || `${mistakeType} affected the trade outcome.`;
};

const inferNotes = (order, existingNotes) => {
  if (existingNotes) {
    return existingNotes;
  }

  const strategy = order.strategy || STRATEGY_FALLBACKS[order.symbol.length % STRATEGY_FALLBACKS.length];
  const side = order.side === 'BUY' ? 'long' : 'short';
  return `Executed a ${side} ${order.type.toLowerCase()} order on ${order.symbol.replace(
    'USDT',
    '/USDT'
  )} using the ${strategy} setup. Review structure, timing, and risk before repeating the play.`;
};

const computeRiskScore = (order, existingScore) => {
  if (typeof existingScore === 'number') {
    return clamp(Math.round(existingScore), 0, 100);
  }

  const pnl = Number(order.realizedPnL || 0);
  const total = Number(order.total || 0);
  const pnlRatio = total ? pnl / total : 0;
  const base =
    70 +
    (pnl > 0 ? 18 : pnl < 0 ? -24 : 0) -
    clamp(Math.abs(pnlRatio) * 100, 0, 16) +
    (order.type === 'LIMIT' ? 4 : 0);

  return clamp(Math.round(base), 18, 96);
};

const buildTradePriceView = (order, latestPriceMap) => {
  const entry = Number(order.price || order.limitPrice || 0);
  const fallbackExit = latestPriceMap[order.symbol] || entry;
  const exit =
    order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0 ? entry : fallbackExit;
  const pnl =
    order.side === 'SELL'
      ? Number(order.realizedPnL || 0)
      : (Number(exit) - Number(entry)) * Number(order.quantity || 0);

  return {
    entry,
    exit,
    pnl,
  };
};

const buildEmotionPnl = (rows) =>
  EMOTION_ORDER.map((emotion) => {
    const matching = rows.filter((row) => row.emotion === emotion);
    return {
      emotion,
      pnl: Math.round(matching.reduce((sum, row) => sum + Number(row.profitNum || 0), 0)),
      trades: matching.length,
    };
  });

const buildJournalRows = (orders, journalDocs, latestPriceMap) => {
  const journalByOrderId = new Map(
    journalDocs
      .filter((doc) => doc.order)
      .map((doc) => [String(doc.order), doc])
  );

  const orderCountByDay = new Map();
  orders.forEach((order) => {
    const key = startOfUtcDay(orderDate(order)).toISOString();
    orderCountByDay.set(key, (orderCountByDay.get(key) || 0) + 1);
  });

  const mappedOrders = orders.map((order) => {
    const linked = journalByOrderId.get(String(order._id));
    const dayKey = startOfUtcDay(orderDate(order)).toISOString();
    const { entry, exit, pnl } = buildTradePriceView(order, latestPriceMap);
    const mistakeType = inferMistakeType(order, linked?.mistakeType, orderCountByDay.get(dayKey));
    const emotion = inferEmotion(order, linked?.emotion);
    const notes = inferNotes(order, linked?.notes);
    const riskScore = computeRiskScore(order, linked?.riskScore);

    return {
      id: linked?._id ? String(linked._id) : String(order._id),
      orderId: String(order._id),
      tradeId: String(order._id),
      date: orderDate(order).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      asset: order.symbol.replace('USDT', '/USDT'),
      side: order.side === 'BUY' ? 'Long' : 'Short',
      entry: formatCurrency(entry),
      exit: formatCurrency(exit),
      profit: formatSignedCurrency(pnl),
      profitNum: Number(pnl.toFixed(2)),
      strategy: order.strategy || 'Unlabeled',
      emotion,
      rr: `${pnl >= 0 ? '+' : '-'}${Math.max(0.8, Math.min(4.2, Math.abs(pnl) / Math.max(1, Number(order.total || 1) * 0.02))).toFixed(1)}R`,
      notes,
      mistake: inferMistakeText(order, mistakeType, linked?.mistake),
      mistakeType,
      riskScore,
      source: linked?.source || 'AUTO',
      timestamp: order.createdAt,
    };
  });

  const manualOnly = journalDocs
    .filter((doc) => !doc.order)
    .map((doc) => ({
      id: String(doc._id),
      orderId: null,
      tradeId: null,
      date: orderDate(doc).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }),
      asset: doc.symbol.replace('USDT', '/USDT'),
      side: 'Long',
      entry: '$0',
      exit: '$0',
      profit: '$0',
      profitNum: 0,
      strategy: doc.strategy || 'Manual',
      emotion: doc.emotion || 'Calm',
      rr: '0.0R',
      notes: doc.notes || '',
      mistake: doc.mistake || '',
      mistakeType: doc.mistakeType || '',
      riskScore: computeRiskScore({ realizedPnL: 0, total: 0, type: 'MARKET' }, doc.riskScore),
      source: doc.source || 'MANUAL',
      timestamp: doc.createdAt,
    }));

  return [...mappedOrders, ...manualOnly].sort(
    (left, right) => new Date(right.timestamp) - new Date(left.timestamp)
  );
};

const buildAnalyticsView = ({ orders, snapshots, benchmarkSnapshots }) => {
  const filteredOrders = orders.filter(
    (order) => order.status === 'FILLED' || order.status === 'CANCELLED'
  );
  const closedOrders = filteredOrders.filter(
    (order) => order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0
  );
  const winningOrders = closedOrders.filter((order) => Number(order.realizedPnL || 0) > 0);
  const losingOrders = closedOrders.filter((order) => Number(order.realizedPnL || 0) < 0);
  const grossProfit = winningOrders.reduce((sum, order) => sum + Number(order.realizedPnL || 0), 0);
  const grossLoss = Math.abs(
    losingOrders.reduce((sum, order) => sum + Number(order.realizedPnL || 0), 0)
  );
  const netProfit = grossProfit - grossLoss;
  const avgRiskPerTrade = closedOrders.length
    ? average(closedOrders.map((order) => Math.abs(Number(order.realizedPnL || 0)) / Math.max(1, Number(order.total || 1)) * 100))
    : 0;

  const strategyMap = new Map();
  const weekdayMap = new Map(
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => [day, { day, profit: 0, trades: 0 }])
  );
  const assetMap = new Map();

  closedOrders.forEach((order) => {
    const strategy = order.strategy || 'Unlabeled';
    const strategyEntry = strategyMap.get(strategy) || {
      name: strategy,
      winCount: 0,
      lossCount: 0,
      grossProfit: 0,
      grossLoss: 0,
      trades: 0,
      profit: 0,
    };
    const pnl = Number(order.realizedPnL || 0);
    strategyEntry.trades += 1;
    strategyEntry.profit += pnl;
    if (pnl >= 0) {
      strategyEntry.winCount += 1;
      strategyEntry.grossProfit += pnl;
    } else {
      strategyEntry.lossCount += 1;
      strategyEntry.grossLoss += Math.abs(pnl);
    }
    strategyMap.set(strategy, strategyEntry);

    const symbolKey = order.symbol.replace('USDT', '');
    const assetEntry = assetMap.get(symbolKey) || { asset: symbolKey, profit: 0, trades: 0 };
    assetEntry.profit += pnl;
    assetEntry.trades += 1;
    assetMap.set(symbolKey, assetEntry);

    const weekday = orderDate(order).toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    });
    const weekdayEntry = weekdayMap.get(weekday);
    if (weekdayEntry) {
      weekdayEntry.profit += pnl;
      weekdayEntry.trades += 1;
    }
  });

  const snapshotReturns = snapshots.map((snapshot) => Number(snapshot.monthlyReturn || 0));
  const winRateData = snapshots.map((snapshot, index) => ({
    week: `P${index + 1}`,
    rate: closedOrders.length
      ? Number(
          (
            closedOrders
              .slice(0, Math.min(closedOrders.length, (index + 1) * 2))
              .filter((order) => Number(order.realizedPnL || 0) > 0).length /
            Math.max(1, Math.min(closedOrders.length, (index + 1) * 2))
          ) * 100
        ).toFixed(1)
      : 0,
  }));

  const strategyComparison = [...strategyMap.values()]
    .map((entry) => ({
      name: entry.name,
      winRate: entry.trades ? Number(((entry.winCount / entry.trades) * 100).toFixed(1)) : 0,
      profitFactor: entry.grossLoss
        ? Number((entry.grossProfit / entry.grossLoss).toFixed(2))
        : entry.grossProfit > 0
          ? Number(entry.grossProfit.toFixed(2))
          : 0,
      trades: entry.trades,
      profit: Number(entry.profit.toFixed(2)),
    }))
    .sort((left, right) => right.profit - left.profit);

  const equityVsBenchmark = snapshots.map((snapshot, index) => {
    const benchmark = benchmarkSnapshots[index];
    return {
      month: snapshot.label,
      equity: Number(snapshot.portfolioValue || 0),
      benchmark: benchmark ? Number(benchmark.closePrice || 0) : 0,
    };
  });

  const expectancyData = closedOrders.slice(0, 12).map((order, index) => ({
    session: `S${index + 1}`,
    winRate: Number(order.realizedPnL || 0) > 0 ? 1 : 0,
    avgWin: Number(order.realizedPnL || 0) > 0 ? Number(order.realizedPnL || 0) : 0,
    avgLoss: Number(order.realizedPnL || 0) < 0 ? Math.abs(Number(order.realizedPnL || 0)) : 0,
    expectancy: Math.round(Number(order.realizedPnL || 0)),
  }));

  const bestStrategy = strategyComparison[0];
  const worstAsset = [...assetMap.values()].sort((left, right) => left.profit - right.profit)[0];
  const bestWeekday = [...weekdayMap.values()].sort((left, right) => right.profit - left.profit)[0];
  const monthlyVolatility = average(snapshotReturns.map((value) => Math.abs(value)));
  const alphaVsBtc =
    equityVsBenchmark.length > 1
      ? ((equityVsBenchmark[equityVsBenchmark.length - 1].equity -
          equityVsBenchmark[0].equity) /
          Math.max(1, equityVsBenchmark[0].equity) -
          (equityVsBenchmark[equityVsBenchmark.length - 1].benchmark -
            equityVsBenchmark[0].benchmark) /
            Math.max(1, equityVsBenchmark[0].benchmark)) *
        100
      : 0;

  return {
    winRateData,
    profitByAsset: [...assetMap.values()],
    profitByWeekday: [...weekdayMap.values()],
    tradeDurationProfit: closedOrders.slice(0, 12).map((order, index) => ({
      duration: Number((((index % 6) + 1) * (index < 4 ? 0.5 : index < 8 ? 4 : 12)).toFixed(1)),
      profit: Number(order.realizedPnL || 0),
      rr: Number(
        Math.max(0.6, Math.min(4.4, Math.abs(Number(order.realizedPnL || 0)) / Math.max(1, Number(order.total || 1) * 0.02))).toFixed(1)
      ),
    })),
    strategyComparison,
    equityVolatility: snapshots.map((snapshot) => ({
      date: snapshot.label,
      equity: Number(snapshot.portfolioValue || 0),
      vol: Number(Math.abs(snapshot.monthlyReturn || 0).toFixed(1)),
    })),
    drawdownData: snapshots.map((snapshot) => ({
      date: snapshot.label,
      dd: Number(snapshot.drawdown || 0),
    })),
    equityVsBenchmark,
    expectancyData,
    summaryCards: [
      {
        key: 'avgRiskTrade',
        label: 'Avg Risk/Trade',
        value: formatPercent(avgRiskPerTrade, 2),
        desc: 'of portfolio per closed trade',
      },
      {
        key: 'bestStrategy',
        label: 'Best Strategy',
        value: bestStrategy ? bestStrategy.name : 'No trades',
        desc: bestStrategy ? `${formatPercent(bestStrategy.winRate)} win rate` : 'Build history first',
      },
      {
        key: 'worstAsset',
        label: 'Worst Asset',
        value: worstAsset ? `${worstAsset.asset}/USDT` : 'N/A',
        desc: worstAsset ? `${formatSignedCurrency(worstAsset.profit)} total P&L` : 'No losing asset yet',
      },
      {
        key: 'bestSession',
        label: 'Best Session',
        value: bestWeekday?.day || 'N/A',
        desc: bestWeekday ? `${formatSignedCurrency(bestWeekday.profit)} avg profit` : 'Needs more trades',
      },
      {
        key: 'equityVolatility',
        label: 'Equity Volatility',
        value: formatPercent(monthlyVolatility),
        desc: 'avg monthly absolute move',
      },
      {
        key: 'alphaVsBtc',
        label: 'Alpha vs BTC',
        value: formatSignedCurrency(alphaVsBtc, 0).replace('$', ''),
        desc: 'outperformance vs benchmark',
      },
    ],
    totals: {
      closedTrades: closedOrders.length,
      netProfit,
      grossProfit,
      grossLoss,
    },
    meta: {
      metricMode: 'HYBRID',
      estimatedMetrics: ['tradeDurationProfit', 'expectancyData'],
      derivedMetrics: [
        'winRateData',
        'profitByAsset',
        'profitByWeekday',
        'strategyComparison',
        'equityVolatility',
        'drawdownData',
        'equityVsBenchmark',
        'summaryCards',
      ],
      notes: [
        'Trade duration buckets are estimated from available trade history, not captured wall-clock hold time.',
        'Expectancy is derived from closed-trade outcomes and should be treated as an estimated coaching metric.',
      ],
    },
  };
};

const buildMistakeView = ({ journalRows, orders }) => {
  const filledOrders = orders.filter((order) => order.status === 'FILLED');
  const rowsWithMistakes = journalRows.filter((row) => row.mistakeType);
  const groupedMistakes = CATEGORY_ORDER.map((label) => {
    const matching = rowsWithMistakes.filter((row) => row.mistakeType === label);
    return {
      mistake: label,
      count: matching.length,
      impact: Math.round(
        matching.reduce((sum, row) => sum + Math.min(0, Number(row.profitNum || 0)), 0)
      ),
    };
  }).filter((entry) => entry.count > 0);

  const overtradingByWeek = new Map();
  filledOrders.forEach((order) => {
    const date = orderDate(order);
    const monday = startOfUtcWeek(date).toISOString();
    const existing = overtradingByWeek.get(monday) || {
      week: `W${overtradingByWeek.size + 1}`,
      trades: 0,
      pnl: 0,
    };
    existing.trades += 1;
    existing.pnl += Number(order.realizedPnL || 0);
    overtradingByWeek.set(monday, existing);
  });

  const slSizeData = [
    { size: '<0.5%', min: 0, max: 0.5 },
    { size: '0.5-1%', min: 0.5, max: 1 },
    { size: '1-2%', min: 1, max: 2 },
    { size: '2-3%', min: 2, max: 3 },
    { size: '3-5%', min: 3, max: 5 },
    { size: '>5%', min: 5, max: Infinity },
  ].map((bucket) => {
    const matching = journalRows.filter((row) => {
      const ratio = Math.abs(Number(row.profitNum || 0)) / Math.max(1, Math.abs(Number(row.profitNum || 0)) * 20) * 100;
      return ratio >= bucket.min && ratio < bucket.max;
    });
    return {
      size: bucket.size,
      count: matching.length,
      winRate: matching.length
        ? Number(
            (
              (matching.filter((row) => Number(row.profitNum || 0) > 0).length /
                matching.length) *
              100
            ).toFixed(1)
          )
        : 0,
    };
  });

  const riskViolationTrend = Array.from(
    journalRows.reduce((map, row) => {
      const date = new Date(row.timestamp);
      const key = monthKey(date);
      const label = date.toLocaleDateString('en-US', {
        month: 'short',
        timeZone: 'UTC',
      });
      const current = map.get(key) || { month: label, violations: 0 };
      if (row.riskScore < 60) {
        current.violations += 1;
      }
      map.set(key, current);
      return map;
    }, new Map()).values()
  );

  const mistakePieData = groupedMistakes.map((entry, index) => ({
    name: entry.mistake,
    value: entry.count,
    fill: ['#EA3943', '#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#94A3B8'][index % 6],
  }));

  const totalMistakes = groupedMistakes.reduce((sum, entry) => sum + entry.count, 0);
  const totalImpact = groupedMistakes.reduce((sum, entry) => sum + Math.abs(entry.impact), 0);
  const overtradingWeeks = [...overtradingByWeek.values()].filter((entry) => entry.trades > 15).length;
  const riskViolations = journalRows.filter((row) => row.riskScore < 60).length;
  const mistakeFreeRate = journalRows.length
    ? ((journalRows.filter((row) => !row.mistakeType).length / journalRows.length) * 100)
    : 0;

  const improvements = CATEGORY_ORDER.slice(0, 5).map((label, index) => {
    const matching = groupedMistakes.find((entry) => entry.mistake === label);
    const before = clamp(45 + (matching?.count || 0) * 2 + index * 3, 20, 92);
    const after = clamp(before + 10 - index, 25, 96);
    return {
      area: label,
      before,
      after,
      trend: after - before > 6 ? 'improving' : 'slow',
    };
  });

  const actualPnl = journalRows.reduce((sum, row) => sum + Number(row.profitNum || 0), 0);
  const sortedMistakes = [...groupedMistakes].sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact));
  let runningPnl = actualPnl;
  const recoveryScenarios = [
    { name: 'Actual', pnl: Math.round(actualPnl), label: 'Current P&L' },
    ...sortedMistakes.slice(0, 3).map((entry) => {
      runningPnl += Math.abs(entry.impact);
      return {
        name: `No ${entry.mistake}`,
        pnl: Math.round(runningPnl),
        label: `–${entry.mistake}`,
      };
    }),
    { name: 'All Fixed', pnl: Math.round(actualPnl + totalImpact), label: 'All fixed' },
  ];

  return {
    mistakeFrequency: groupedMistakes,
    overtradingData: [...overtradingByWeek.values()],
    slSizeData,
    riskViolationTrend,
    mistakePieData,
    summaryCards: [
      { key: 'totalMistakes', label: 'Total Mistakes', value: String(totalMistakes), sub: 'Tracked journal reviews' },
      { key: 'pnlLost', label: 'P&L Lost to Mistakes', value: `-${formatCurrency(totalImpact)}`.replace('--', '-'), sub: 'Recoverable losses' },
      { key: 'avgRisk', label: 'Avg Risk Score', value: `${Math.round(average(journalRows.map((row) => row.riskScore || 0)))}`, sub: 'Per reviewed trade' },
      { key: 'overtradingDays', label: 'Overtrading Weeks', value: String(overtradingWeeks), sub: '>15 trades/week flagged' },
      { key: 'riskViolations', label: 'Risk Violations', value: String(riskViolations), sub: 'Scores under 60' },
      { key: 'mistakeFreeRate', label: 'Mistake-Free Rate', value: formatPercent(mistakeFreeRate), sub: 'Trades without issues' },
    ],
    improvements,
    recoveryScenarios,
  };
};

const normalizeLeaderboardMode = (mode) => {
  const upper = String(mode || 'COMPETITIVE').trim().toUpperCase();
  return upper === 'DEMO' ? 'DEMO' : 'COMPETITIVE';
};

const buildLeaderboardView = async ({ currentUserId, period, mode }) => {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedMode = normalizeLeaderboardMode(mode);
  const users = await User.find({ status: 'active' })
    .select('name email wallet avatarColor demoBalanceTopUpTotal')
    .lean();
  const scopedUsers = users.filter((user) =>
    normalizedMode === 'DEMO'
      ? true
      : Number(user.demoBalanceTopUpTotal || 0) <= 0
  );
  const userIds = scopedUsers.map((user) => user._id);
  const [orders, snapshots, journalEntries] = await Promise.all([
    Order.find({ user: { $in: userIds } }).lean(),
    PortfolioSnapshot.find({ user: { $in: userIds } }).sort({ periodStart: 1 }).lean(),
    JournalEntry.find({ user: { $in: userIds } }).lean(),
  ]);

  const rows = scopedUsers.map((user, index) => {
    const userOrders = filterByPeriod(
      orders.filter((order) => String(order.user) === String(user._id)),
      orderDate,
      normalizedPeriod
    );
    const userSnapshots = filterByPeriod(
      snapshots.filter((snapshot) => String(snapshot.user) === String(user._id)),
      (snapshot) => new Date(snapshot.periodStart),
      normalizedPeriod
    );
    const userJournal = filterByPeriod(
      journalEntries.filter((entry) => String(entry.user) === String(user._id)),
      (entry) => new Date(entry.updatedAt || entry.createdAt),
      normalizedPeriod
    );
    const closedOrders = userOrders.filter(
      (order) => order.side === 'SELL' || Number(order.realizedPnL || 0) !== 0
    );
    const winning = closedOrders.filter((order) => Number(order.realizedPnL || 0) > 0);
    const latest = userSnapshots[userSnapshots.length - 1];
    const first = userSnapshots[0];
    const profitPct = first && latest
      ? ((Number(latest.portfolioValue || 0) - Number(first.portfolioValue || 0)) /
          Math.max(1, Number(first.portfolioValue || 0))) *
        100
      : closedOrders.reduce((sum, order) => sum + Number(order.realizedPnL || 0), 0) / 100;
    const strategies = closedOrders.reduce((map, order) => {
      const name = order.strategy || 'Unlabeled';
      map.set(name, (map.get(name) || 0) + Number(order.realizedPnL || 0));
      return map;
    }, new Map());
    const topStrategy = [...strategies.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || 'Mixed';
    const avgRisk = userJournal.length
      ? Math.round(average(userJournal.map((entry) => Number(entry.riskScore || 70))))
      : 70;
    const consistency = userSnapshots.length > 1
      ? clamp(
          Math.round(
            100 -
              average(userSnapshots.map((snapshot) => Math.abs(Number(snapshot.monthlyReturn || 0))))
          ),
          40,
          96
        )
      : 60;

    return {
      userId: String(user._id),
      rank: index + 1,
      name: user.name || user.email,
      avatar: (user.name || user.email || 'U')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      avatarColor: user.avatarColor || '#4F46E5',
      profitNum: Number(profitPct.toFixed(1)),
      profit: `${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}%`,
      winRate: formatPercent(closedOrders.length ? (winning.length / closedOrders.length) * 100 : 0),
      trades: closedOrders.length,
      strategy: topStrategy,
      riskScore: avgRisk,
      consistency,
      badge: String(user._id) === String(currentUserId) ? 'You' : '',
    };
  });

  const sortedRows = rows.sort((left, right) => right.profitNum - left.profitNum).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
  const currentUserRank = sortedRows.find((row) => row.userId === String(currentUserId))?.rank || 1;
  const friends = sortedRows.filter((row) =>
    Math.abs(row.rank - currentUserRank) <= 2 || row.userId === String(currentUserId)
  );

  return {
    period: PERIOD_LABELS[normalizedPeriod],
    mode: normalizedMode,
    modes: ['COMPETITIVE', 'DEMO'],
    fairnessNote:
      normalizedMode === 'COMPETITIVE'
        ? 'Competitive ranks exclude accounts that received demo balance top-ups.'
        : 'Demo ranks include all practice accounts, including funded training boosts.',
    traders: sortedRows,
    friends,
  };
};

const loadUserInsightsContext = async (userId) => {
  const [orders, journalEntries, snapshots, benchmarkSnapshots, portfolio] = await Promise.all([
    Order.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    JournalEntry.find({ user: userId }).sort({ updatedAt: -1 }).lean(),
    PortfolioSnapshot.find({ user: userId }).sort({ periodStart: 1 }).lean(),
    MarketSnapshot.find({ symbol: 'BTCUSDT' }).sort({ periodStart: 1 }).lean(),
    getPortfolio(userId),
  ]);

  const latestPriceMap = {};
  portfolio.assets.forEach((asset) => {
    latestPriceMap[asset.symbol] = asset.currentPrice || asset.avgBuyPrice || 0;
  });

  return {
    orders,
    journalEntries,
    snapshots,
    benchmarkSnapshots,
    portfolio,
    latestPriceMap,
  };
};

module.exports = {
  EMOTION_ORDER,
  CATEGORY_ORDER,
  PERIOD_LABELS,
  normalizePeriod,
  filterByPeriod,
  loadUserInsightsContext,
  buildJournalRows,
  buildEmotionPnl,
  buildAnalyticsView,
  buildMistakeView,
  buildLeaderboardView,
};
