const mongoose = require('mongoose');

const strategyConditionSchema = new mongoose.Schema(
  {
    connector: { type: String, trim: true, default: 'AND' },
    indicator: { type: String, trim: true, required: true },
    operator: { type: String, trim: true, required: true },
    value: { type: String, trim: true, required: true },
    timeframe: { type: String, trim: true, default: '4H' },
  },
  { _id: false }
);

const strategyActionSchema = new mongoose.Schema(
  {
    action: { type: String, trim: true, required: true },
    size: { type: String, trim: true, required: true },
    sl: { type: String, trim: true, required: true },
    tp: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const strategySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
    },
    conditions: {
      type: [strategyConditionSchema],
      default: [],
    },
    actions: {
      type: [strategyActionSchema],
      default: [],
    },
    latestBacktest: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Strategy', strategySchema);
