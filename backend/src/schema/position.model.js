const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema(
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
      index: true,
    },
    side: {
      type: String,
      enum: ['LONG', 'SHORT'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    initialMargin: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
      required: true,
    },
    takeProfit: {
      type: Number,
      required: true,
    },
    leverage: {
      type: Number,
      default: 1,
    },
    strategy: {
      type: String,
      trim: true,
      default: 'Unlabeled',
    },
    sourceOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'LIQUIDATED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    exitPrice: {
      type: Number,
      default: null,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    exitReason: {
      type: String,
      trim: true,
      default: '',
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

positionSchema.index({ user: 1, status: 1, symbol: 1 });

module.exports = mongoose.model('Position', positionSchema);
