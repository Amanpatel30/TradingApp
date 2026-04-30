const mongoose = require('mongoose');

const marketCandlePointSchema = new mongoose.Schema(
  {
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    time: String,
  },
  { _id: false }
);

const marketCandleSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    timeframe: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    candles: {
      type: [marketCandlePointSchema],
      default: [],
    },
    source: {
      type: String,
      default: 'SIMULATED_SEED',
      trim: true,
    },
    fetchedFrom: {
      type: String,
      default: '',
      trim: true,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

marketCandleSchema.index({ symbol: 1, year: 1, timeframe: 1 }, { unique: true });

module.exports = mongoose.model('MarketCandle', marketCandleSchema);
