const mongoose = require('mongoose');

const replayTradeSchema = new mongoose.Schema(
  {
    side: { type: String, trim: true, required: true },
    size: { type: Number, default: 0 },
    entry: { type: Number, default: 0 },
    exit: { type: Number, default: 0 },
    pnl: { type: Number, default: 0 },
    ok: { type: Boolean, default: false },
    mistake: { type: String, trim: true, default: '' },
  },
  { timestamps: true, _id: true }
);

const replaySessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    timeframe: {
      type: String,
      required: true,
      trim: true,
    },
    visibleCount: {
      type: Number,
      default: 30,
    },
    speed: {
      type: Number,
      default: 1,
    },
    trades: {
      type: [replayTradeSchema],
      default: [],
    },
  },
  { timestamps: true }
);

replaySessionSchema.index(
  { user: 1, symbol: 1, year: 1, timeframe: 1 },
  { unique: true }
);

module.exports = mongoose.model('ReplaySession', replaySessionSchema);
