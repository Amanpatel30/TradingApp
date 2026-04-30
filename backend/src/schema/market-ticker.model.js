const mongoose = require('mongoose');

const marketTickerSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    baseAsset: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    quoteAsset: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USDT',
    },
    type: {
      type: String,
      enum: ['CRYPTO', 'STOCK'],
      default: 'CRYPTO',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      default: null,
    },
    open: {
      type: Number,
      default: null,
    },
    high: {
      type: Number,
      default: null,
    },
    low: {
      type: Number,
      default: null,
    },
    volume: {
      type: Number,
      default: null,
    },
    changePercent: {
      type: Number,
      default: null,
    },
    openInterest: {
      type: Number,
      default: null,
    },
    openInterestChangePercent: {
      type: Number,
      default: null,
    },
    fundingRate: {
      type: Number,
      default: null,
    },
    source: {
      type: String,
      default: 'BINANCE_LIVE',
    },
    timestamp: {
      type: Date,
      default: null,
    },
    lastDerivativesSyncAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketTicker', marketTickerSchema);
