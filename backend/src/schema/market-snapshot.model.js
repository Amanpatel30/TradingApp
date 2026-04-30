const mongoose = require('mongoose');

const marketSnapshotSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodType: {
      type: String,
      enum: ['MONTHLY'],
      default: 'MONTHLY',
    },
    closePrice: {
      type: Number,
      required: true,
    },
    openPrice: {
      type: Number,
      default: 0,
    },
    highPrice: {
      type: Number,
      default: 0,
    },
    lowPrice: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    quoteVolume: {
      type: Number,
      default: 0,
    },
    tradeCount: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: 'BINANCE_KLINES',
    },
  },
  { timestamps: true }
);

marketSnapshotSchema.index(
  { symbol: 1, periodStart: 1, periodType: 1 },
  { unique: true }
);

module.exports = mongoose.model('MarketSnapshot', marketSnapshotSchema);
