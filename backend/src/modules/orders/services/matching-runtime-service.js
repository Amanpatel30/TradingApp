const activeSymbols = new Set();
const queuedTicksBySymbol = new Map();
const activePositionClosures = new Set();
const lastProcessedEventTimeBySymbol = new Map();
const limitTouchCounts = new Map();

const normalizeSymbol = (symbol) => String(symbol || '').toUpperCase();

const enqueueLatestTick = ({ symbol, currentPrice, eventTime }) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  const existing = queuedTicksBySymbol.get(normalizedSymbol);

  if (!existing || Number(eventTime || 0) >= Number(existing.eventTime || 0)) {
    queuedTicksBySymbol.set(normalizedSymbol, {
      currentPrice,
      eventTime: Number(eventTime || Date.now()),
    });
  }
};

const runMatchingForSymbol = async ({ symbol, currentPrice, eventTime, processTick }) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  const normalizedEventTime = Number(eventTime || Date.now());
  const lastProcessedEventTime = Number(lastProcessedEventTimeBySymbol.get(normalizedSymbol) || 0);

  if (lastProcessedEventTime > 0 && normalizedEventTime < lastProcessedEventTime) {
    return false;
  }

  if (activeSymbols.has(normalizedSymbol)) {
    enqueueLatestTick({
      symbol: normalizedSymbol,
      currentPrice,
      eventTime: normalizedEventTime,
    });
    return false;
  }

  activeSymbols.add(normalizedSymbol);

  try {
    let nextTick = {
      currentPrice,
      eventTime: normalizedEventTime,
    };

    while (nextTick) {
      queuedTicksBySymbol.delete(normalizedSymbol);
      lastProcessedEventTimeBySymbol.set(
        normalizedSymbol,
        Number(nextTick.eventTime || normalizedEventTime)
      );
      await processTick(nextTick);
      nextTick = queuedTicksBySymbol.get(normalizedSymbol) || null;
    }

    return true;
  } finally {
    activeSymbols.delete(normalizedSymbol);

    if (queuedTicksBySymbol.has(normalizedSymbol)) {
      const queuedTick = queuedTicksBySymbol.get(normalizedSymbol);
      await runMatchingForSymbol({
        symbol: normalizedSymbol,
        currentPrice: queuedTick.currentPrice,
        eventTime: queuedTick.eventTime,
        processTick,
      });
    }
  }
};

const claimPositionClose = (positionId) => {
  const normalized = String(positionId || '');
  if (!normalized || activePositionClosures.has(normalized)) {
    return false;
  }

  activePositionClosures.add(normalized);
  return true;
};

const releasePositionClose = (positionId) => {
  activePositionClosures.delete(String(positionId || ''));
};

const registerLimitConfirmation = (orderId, matched) => {
  const normalizedOrderId = String(orderId || '');
  if (!normalizedOrderId) {
    return false;
  }

  if (!matched) {
    limitTouchCounts.delete(normalizedOrderId);
    return false;
  }

  const nextCount = Number(limitTouchCounts.get(normalizedOrderId) || 0) + 1;
  limitTouchCounts.set(normalizedOrderId, nextCount);
  return nextCount >= 2;
};

const clearLimitConfirmation = (orderId) => {
  limitTouchCounts.delete(String(orderId || ''));
};

module.exports = {
  runMatchingForSymbol,
  claimPositionClose,
  releasePositionClose,
  registerLimitConfirmation,
  clearLimitConfirmation,
};
