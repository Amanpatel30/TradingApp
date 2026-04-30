const market = {};
let connectionStatus = 'DISCONNECTED';
let lastMarketEventAt = 0;

const updatePrice = (symbol, data) => {
  const current = market[symbol] || {};
  const incomingEventTime = Number(data?.eventTime || data?.timestamp || 0);
  const currentEventTime = Number(current?.eventTime || current?.timestamp || 0);

  if (
    Number.isFinite(incomingEventTime) &&
    Number.isFinite(currentEventTime) &&
    currentEventTime > 0 &&
    incomingEventTime > 0 &&
    incomingEventTime < currentEventTime
  ) {
    return current;
  }

  market[symbol] = {
    ...current,
    ...data,
  };

  lastMarketEventAt = Math.max(
    lastMarketEventAt,
    Number(data?.eventTime || data?.timestamp?.getTime?.() || data?.timestamp || Date.now())
  );

  return market[symbol];
};

const getPrice = (symbol) => {
  return market[symbol];
};

const getAllPrices = () => {
  return market;
};

const setMarketConnectionStatus = (status) => {
  connectionStatus = String(status || 'DISCONNECTED').toUpperCase();
};

const getLatestMarketEventAt = () => lastMarketEventAt;

const getMarketFeedStatus = () => {
  const now = Date.now();
  const ageMs = lastMarketEventAt ? now - lastMarketEventAt : Number.POSITIVE_INFINITY;

  let status = 'DISCONNECTED';
  if (connectionStatus === 'CONNECTED' || connectionStatus === 'LIVE') {
    if (ageMs <= 3000) {
      status = 'LIVE';
    } else if (ageMs <= 15000) {
      status = 'DELAYED';
    } else {
      status = 'DISCONNECTED';
    }
  }

  return {
    status,
    lastMarketEventAt,
    ageMs: Number.isFinite(ageMs) ? ageMs : null,
  };
};

module.exports = {
  updatePrice,
  getPrice,
  getAllPrices,
  setMarketConnectionStatus,
  getLatestMarketEventAt,
  getMarketFeedStatus,
};
