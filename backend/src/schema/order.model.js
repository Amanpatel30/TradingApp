const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    side: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true,
    },
    type: {
      type: String,
      enum: ['MARKET', 'LIMIT'],
      default: 'MARKET',
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    limitPrice: {
      type: Number,
      required: function() { return this.type === 'LIMIT'; }
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'PROCESSING', 'FILLED', 'CANCELLED'],
      default: 'FILLED',
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    stopLoss: {
      type: Number,
      default: null,
    },
    takeProfit: {
      type: Number,
      default: null,
    },
    reservedAsset: {
      type: String,
      trim: true,
      default: '',
    },
    reservedAmount: {
      type: Number,
      default: 0,
    },
    riskPercent: {
      type: Number,
      default: 0,
    },
    spreadApplied: {
      type: Number,
      default: 0,
    },
    slippageApplied: {
      type: Number,
      default: 0,
    },
    executionSource: {
      type: String,
      trim: true,
      default: 'SIMULATED_LIVE_TICK',
    },
    exitReason: {
      type: String,
      trim: true,
      default: '',
    },
    strategy: {
      type: String,
      trim: true,
      default: 'Unlabeled',
    },
    seedKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    clientOrderId: {
      type: String,
      trim: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, clientOrderId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
