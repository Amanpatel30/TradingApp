const JournalEntry = require('../../../schema/journal-entry.model');
const Order = require('../../../schema/order.model');
const { BadRequestError } = require('../../../utils/custom-error');

const sanitizeText = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const upsertJournalEntry = async (userId, payload, entryId = null) => {
  const orderId = payload.orderId || null;

  if (orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
      throw new BadRequestError('Trade not found for this user');
    }

    const entry = await JournalEntry.findOneAndUpdate(
      { user: userId, order: orderId },
      {
        $set: {
          user: userId,
          order: orderId,
          symbol: order.symbol,
          strategy: sanitizeText(payload.strategy, order.strategy || 'Unlabeled'),
          emotion: sanitizeText(payload.emotion, 'Calm'),
          notes: sanitizeText(payload.notes),
          mistake: sanitizeText(payload.mistake),
          mistakeType: sanitizeText(payload.mistakeType),
          riskScore:
            typeof payload.riskScore === 'number' ? payload.riskScore : 70,
          source: 'MANUAL',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return entry;
  }

  if (!payload.symbol) {
    if (!entryId) {
      throw new BadRequestError('Please provide symbol for a manual journal entry');
    }
  }

  if (entryId) {
    const entry = await JournalEntry.findOneAndUpdate(
      { _id: entryId, user: userId },
      {
        $set: {
          symbol: sanitizeText(payload.symbol, 'BTCUSDT').replace('/', ''),
          strategy: sanitizeText(payload.strategy, 'Manual'),
          emotion: sanitizeText(payload.emotion, 'Calm'),
          notes: sanitizeText(payload.notes),
          mistake: sanitizeText(payload.mistake),
          mistakeType: sanitizeText(payload.mistakeType),
          riskScore: typeof payload.riskScore === 'number' ? payload.riskScore : 70,
          source: 'MANUAL',
        },
      },
      { new: true }
    ).lean();

    if (!entry) {
      throw new BadRequestError('Journal entry not found');
    }

    return entry;
  }

  const entry = await JournalEntry.create({
    user: userId,
    symbol: sanitizeText(payload.symbol).replace('/', ''),
    strategy: sanitizeText(payload.strategy, 'Manual'),
    emotion: sanitizeText(payload.emotion, 'Calm'),
    notes: sanitizeText(payload.notes),
    mistake: sanitizeText(payload.mistake),
    mistakeType: sanitizeText(payload.mistakeType),
    riskScore: typeof payload.riskScore === 'number' ? payload.riskScore : 70,
    source: 'MANUAL',
  });

  return entry.toObject();
};

module.exports = {
  upsertJournalEntry,
};
