const LearningLesson = require('../schema/learning-lesson.model');
const LearningPath = require('../schema/learning-path.model');
const LearningProgress = require('../schema/learning-progress.model');
const MarketCandle = require('../schema/market-candle.model');
const JournalEntry = require('../schema/journal-entry.model');
const Order = require('../schema/order.model');

const lessonSeeds = [
  { lessonId: 1, category: 'concepts', title: 'How Order Books Work', desc: 'Understand bid/ask, depth of market, and how orders get filled.', duration: '12 min', level: 'Beginner', rating: 4.8, iconKey: 'BookOpen', color: '#3B82F6', quizQuestions: [{ question: "What does the 'ask' price represent in an order book?", options: ['The price sellers are willing to accept', 'The price buyers are willing to pay', 'The last traded price', 'The average price'], correctIndex: 0 }, { question: 'Which side of the order book shows buy orders?', options: ['Ask side', 'Bid side', 'Both sides', 'Neither'], correctIndex: 1 }] },
  { lessonId: 2, category: 'concepts', title: 'Candlestick Patterns', desc: 'Master the 12 most important candlestick patterns for price action.', duration: '18 min', level: 'Beginner', rating: 4.9, iconKey: 'BarChart2', color: '#3B82F6', quizQuestions: [{ question: 'A bullish engulfing candle means…', options: ['Buyers overwhelmed sellers', 'Sellers overwhelmed buyers', "Price didn't move", 'Volume was low'], correctIndex: 0 }] },
  { lessonId: 3, category: 'concepts', title: 'Market Structure & Trends', desc: 'Learn to identify higher highs, lower lows, and range environments.', duration: '22 min', level: 'Intermediate', rating: 4.7, iconKey: 'TrendingUp', color: '#3B82F6' },
  { lessonId: 4, category: 'concepts', title: 'Understanding Leverage', desc: 'How leverage amplifies both gains and losses with real examples.', duration: '15 min', level: 'Beginner', rating: 4.6, iconKey: 'Zap', color: '#3B82F6' },
  { lessonId: 5, category: 'concepts', title: 'Liquidity & Market Depth', desc: 'Why liquidity matters and how to trade around thin order books.', duration: '20 min', level: 'Advanced', rating: 4.5, iconKey: 'BarChart2', color: '#3B82F6' },
  { lessonId: 6, category: 'strategies', title: 'Breakout Trading', desc: 'Identify, enter, and manage breakout trades using volume confirmation.', duration: '25 min', level: 'Intermediate', rating: 4.9, iconKey: 'TrendingUp', color: '#16C784' },
  { lessonId: 7, category: 'strategies', title: 'RSI Reversal Strategy', desc: 'Use RSI divergence and oversold or overbought zones for entries.', duration: '20 min', level: 'Intermediate', rating: 4.7, iconKey: 'BarChart2', color: '#16C784' },
  { lessonId: 8, category: 'strategies', title: 'Moving Average Crossovers', desc: 'Build a systematic MA-based strategy from entry to exit rules.', duration: '16 min', level: 'Beginner', rating: 4.6, iconKey: 'TrendingUp', color: '#16C784' },
  { lessonId: 9, category: 'strategies', title: 'VWAP Trading', desc: 'Use VWAP as dynamic support or resistance on intraday charts.', duration: '22 min', level: 'Advanced', rating: 4.8, iconKey: 'BarChart2', color: '#16C784' },
  { lessonId: 10, category: 'strategies', title: 'Swing Trading Setups', desc: 'Capture multi-day moves with minimal screen time using daily charts.', duration: '30 min', level: 'Intermediate', rating: 4.7, iconKey: 'TrendingUp', color: '#16C784' },
  { lessonId: 11, category: 'risk', title: 'The 1% Rule Explained', desc: 'Why risking no more than 1-2% per trade protects your capital long term.', duration: '10 min', level: 'Beginner', rating: 5, iconKey: 'Shield', color: '#F59E0B', quizQuestions: [{ question: 'The 1% rule states you should risk no more than…', options: ['1% of your total account per trade', '1% of your monthly profit', "1% of each trade's gross profit", '1% per day'], correctIndex: 0 }] },
  { lessonId: 12, category: 'risk', title: 'Position Sizing Formulas', desc: 'Calculate the exact position size for any trade using ATR and account percentage.', duration: '18 min', level: 'Intermediate', rating: 4.8, iconKey: 'BarChart2', color: '#F59E0B' },
  { lessonId: 13, category: 'risk', title: 'Stop Loss Placement', desc: 'Where to set stop losses based on structure, ATR, and volatility.', duration: '20 min', level: 'Intermediate', rating: 4.9, iconKey: 'Shield', color: '#F59E0B' },
  { lessonId: 14, category: 'risk', title: 'Portfolio Risk & Correlation', desc: 'Avoid concentration risk when holding multiple correlated crypto positions.', duration: '24 min', level: 'Advanced', rating: 4.6, iconKey: 'BarChart2', color: '#F59E0B' },
  { lessonId: 15, category: 'platform', title: 'Using the Trade Simulator', desc: 'Full walkthrough of the CryptoSim trade simulator interface.', duration: '14 min', level: 'Beginner', rating: 4.8, iconKey: 'Zap', color: '#8B5CF6' },
  { lessonId: 16, category: 'platform', title: 'Setting Up Market Replay', desc: 'How to select periods, speed, and use replay for deliberate practice.', duration: '12 min', level: 'Beginner', rating: 4.7, iconKey: 'Play', color: '#8B5CF6' },
  { lessonId: 17, category: 'platform', title: 'Strategy Builder Deep Dive', desc: 'Build, test, and optimize no-code strategies with the visual builder.', duration: '28 min', level: 'Intermediate', rating: 4.8, iconKey: 'Cpu', color: '#8B5CF6' },
  { lessonId: 18, category: 'quant', title: 'Backtesting Fundamentals', desc: 'How to correctly backtest a strategy without curve-fitting.', duration: '26 min', level: 'Advanced', rating: 4.7, iconKey: 'BarChart2', color: '#EC4899' },
  { lessonId: 19, category: 'quant', title: 'Sharpe Ratio & Sortino', desc: 'Evaluate strategy quality beyond raw returns using risk-adjusted metrics.', duration: '20 min', level: 'Advanced', rating: 4.6, iconKey: 'BarChart2', color: '#EC4899' },
  { lessonId: 20, category: 'quant', title: 'Monte Carlo Simulation', desc: 'Stress test strategies using random scenario generation.', duration: '35 min', level: 'Expert', rating: 4.8, iconKey: 'Cpu', color: '#EC4899', locked: true },
];

const pathSeeds = [
  { pathId: 'beginner', title: 'Beginner Trader', subtitle: 'Start from zero and build a solid foundation', color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', iconKey: 'BookOpen', lessonIds: [1, 2, 3, 4, 11, 15], level: 'Beginner', duration: '87 min' },
  { pathId: 'intermediate', title: 'Intermediate Strategy Builder', subtitle: 'Build repeatable edge with proven strategies', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', iconKey: 'TrendingUp', lessonIds: [6, 7, 8, 9, 10, 12, 13, 17], level: 'Intermediate', duration: '161 min' },
  { pathId: 'advanced', title: 'Advanced Quant Trading', subtitle: 'Professional-grade analytics and systematic trading', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', iconKey: 'Cpu', lessonIds: [5, 14, 18, 19, 20], level: 'Advanced', duration: '135 min' },
];

const generateCandles = (count, startPrice, seed) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const candles = [];
  let price = startPrice;
  let state = seed;

  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const changeFactor = (((state / 4294967296) - 0.48) * 0.04) + Math.sin(index * 0.18) * 0.01;
    const open = price;
    const close = Math.max(0.1, price * (1 + changeFactor));
    const high = Math.max(open, close) * (1 + 0.006 + ((state % 17) / 1000));
    const low = Math.min(open, close) * (1 - 0.006 - ((state % 13) / 1000));
    candles.push({
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      time: `${months[Math.floor(index / 4) % 12]} W${(index % 4) + 1}`,
    });
    price = close;
  }

  return candles;
};

const replaySeedConfigs = {
  BTCUSDT: 68497,
  ETHUSDT: 2063,
  SOLUSDT: 87,
  BNBUSDT: 630,
  ADAUSDT: 0.252,
};

const seedLearningCatalog = async (userId) => {
  await Promise.all(
    lessonSeeds.map((lesson) =>
      LearningLesson.findOneAndUpdate(
        { lessonId: lesson.lessonId },
        { $set: lesson },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await Promise.all(
    pathSeeds.map((path) =>
      LearningPath.findOneAndUpdate(
        { pathId: path.pathId },
        { $set: path },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  await Promise.all(
    [1, 2, 11, 15].map((lessonId) =>
      LearningProgress.findOneAndUpdate(
        { user: userId, lessonId },
        {
          $set: {
            status: 'COMPLETED',
            score: 100,
            completedAt: new Date('2026-03-01T00:00:00.000Z'),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const seedReplayCandles = async () => {
  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
  const timeframes = ['1H', '4H', '1D', '1W'];

  const jobs = [];
  Object.entries(replaySeedConfigs).forEach(([symbol, startPrice], symbolIndex) => {
    years.forEach((year, yearIndex) => {
      timeframes.forEach((timeframe, timeframeIndex) => {
        const seed = 1000 + symbolIndex * 100 + yearIndex * 10 + timeframeIndex;
        jobs.push(
          MarketCandle.findOneAndUpdate(
            { symbol, year, timeframe },
            {
              $set: {
                symbol,
                year,
                timeframe,
                candles: generateCandles(80, startPrice * (1 + yearIndex * 0.08), seed),
                source: 'SIMULATED_SEED',
                fetchedFrom: 'local-seed-generator',
                lastSyncedAt: new Date('2026-03-01T00:00:00.000Z'),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        );
      });
    });
  });

  await Promise.all(jobs);
};

const seedJournalEntries = async (userId) => {
  const orders = await Order.find({ user: userId, strategy: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  const journalSeeds = [
    {
      emotion: 'Confident',
      notes: 'Breakout held above resistance and followed the plan cleanly.',
      mistake: '',
      mistakeType: '',
      riskScore: 88,
    },
    {
      emotion: 'Calm',
      notes: 'Trend continuation worked well after waiting for confirmation.',
      mistake: '',
      mistakeType: '',
      riskScore: 90,
    },
    {
      emotion: 'Patient',
      notes: 'Waited for RSI confirmation before entering the reversal.',
      mistake: 'Should have scaled out earlier on the first target.',
      mistakeType: 'Early Entry',
      riskScore: 78,
    },
    {
      emotion: 'FOMO',
      notes: 'Chased momentum after the initial move instead of waiting for structure.',
      mistake: 'Entered late and accepted poor location.',
      mistakeType: 'FOMO Chase',
      riskScore: 42,
    },
    {
      emotion: 'Anxious',
      notes: 'Tried to fade strength without a convincing breakdown.',
      mistake: 'Traded against the broader trend.',
      mistakeType: 'Trend Fade',
      riskScore: 36,
    },
    {
      emotion: 'Confident',
      notes: 'Support bounce aligned with higher timeframe structure.',
      mistake: '',
      mistakeType: '',
      riskScore: 92,
    },
  ];

  await Promise.all(
    orders.map((order, index) =>
      JournalEntry.findOneAndUpdate(
        { user: userId, order: order._id },
        {
          $set: {
            user: userId,
            order: order._id,
            symbol: order.symbol,
            strategy: order.strategy || 'Unlabeled',
            emotion: journalSeeds[index]?.emotion || 'Calm',
            notes: journalSeeds[index]?.notes || '',
            mistake: journalSeeds[index]?.mistake || '',
            mistakeType: journalSeeds[index]?.mistakeType || '',
            riskScore: journalSeeds[index]?.riskScore || 70,
            source: 'MANUAL',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
};

const seedContentData = async (userId) => {
  await seedLearningCatalog(userId);
  await seedReplayCandles();
  await seedJournalEntries(userId);
};

module.exports = {
  seedContentData,
};
