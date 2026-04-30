const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    strategy: {
      type: String,
      trim: true,
      default: 'Unlabeled',
    },
    emotion: {
      type: String,
      trim: true,
      default: 'Calm',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    mistake: {
      type: String,
      trim: true,
      default: '',
    },
    mistakeType: {
      type: String,
      trim: true,
      default: '',
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    source: {
      type: String,
      enum: ['AUTO', 'MANUAL'],
      default: 'MANUAL',
    },
  },
  { timestamps: true }
);

journalEntrySchema.index(
  { user: 1, order: 1 },
  {
    unique: true,
    partialFilterExpression: {
      order: { $type: 'objectId' },
    },
  }
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
