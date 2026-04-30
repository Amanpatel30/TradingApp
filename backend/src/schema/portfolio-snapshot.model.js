const mongoose = require('mongoose');

const portfolioSnapshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    label: {
      type: String,
      required: true,
    },
    portfolioValue: {
      type: Number,
      required: true,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    unrealizedPnL: {
      type: Number,
      default: 0,
    },
    netProfit: {
      type: Number,
      default: 0,
    },
    monthlyReturn: {
      type: Number,
      default: 0,
    },
    drawdown: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

portfolioSnapshotSchema.index(
  { user: 1, periodStart: 1, periodType: 1 },
  { unique: true }
);

module.exports = mongoose.model('PortfolioSnapshot', portfolioSnapshotSchema);
