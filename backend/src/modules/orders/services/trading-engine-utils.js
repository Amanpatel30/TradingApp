const { getPrice } = require('../../../state/market.state');
const { BadRequestError } = require('../../../utils/custom-error');

const QUOTE_ASSETS = ['BUSD', 'USDT', 'USDC', 'BTC', 'ETH', 'BNB'];
const MAX_RISK_PERCENT = 2;
const MAX_MARKET_DATA_STALE_MS = 3000;

const round = (value, digits = 8) => Number(Number(value || 0).toFixed(digits));

const normalizeStrategy = (strategy) => {
  if (typeof strategy !== 'string') {
    return 'Unlabeled';
  }

  const normalized = strategy.trim();
  return normalized || 'Unlabeled';
};

const parseSymbol = (symbol) => {
  const upper = String(symbol || '').toUpperCase();

  for (const quote of QUOTE_ASSETS) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      return {
        baseAsset: upper.slice(0, -quote.length),
        quoteAsset: quote,
        normalizedSymbol: upper,
      };
    }
  }

  throw new BadRequestError(
    `Unable to parse symbol "${symbol}". Supported quote assets: ${QUOTE_ASSETS.join(', ')}`
  );
};

const ensureWalletMaps = (user) => {
  if (!user.wallet || !(user.wallet instanceof Map)) {
    user.wallet = new Map([['USDT', 10000]]);
  }

  if (!user.reservedWallet || !(user.reservedWallet instanceof Map)) {
    user.reservedWallet = new Map([['USDT', 0]]);
  }
};

const getAvailableBalance = (user, asset) => round(user.wallet.get(asset) || 0, 8);
const getReservedBalance = (user, asset) => round(user.reservedWallet.get(asset) || 0, 8);

const setAvailableBalance = (user, asset, amount) => {
  user.wallet.set(asset, round(amount, 8));
};

const setReservedBalance = (user, asset, amount) => {
  user.reservedWallet.set(asset, round(amount, 8));
};

const reserveBalance = (user, asset, amount) => {
  const numericAmount = round(amount, 8);
  const available = getAvailableBalance(user, asset);

  if (numericAmount <= 0) {
    return;
  }

  if (available < numericAmount) {
    throw new BadRequestError(
      `Insufficient ${asset} balance. Required: ${numericAmount.toFixed(8)}, Available: ${available.toFixed(8)}`
    );
  }

  setAvailableBalance(user, asset, available - numericAmount);
  setReservedBalance(user, asset, getReservedBalance(user, asset) + numericAmount);
};

const releaseReservedBalance = (user, asset, amount) => {
  const numericAmount = round(amount, 8);
  const reserved = getReservedBalance(user, asset);
  const released = Math.min(reserved, Math.max(0, numericAmount));

  setReservedBalance(user, asset, reserved - released);
  setAvailableBalance(user, asset, getAvailableBalance(user, asset) + released);
};

const adjustReservedBalance = (user, asset, targetReserved) => {
  const currentReserved = getReservedBalance(user, asset);
  const delta = round(targetReserved - currentReserved, 8);

  if (delta > 0) {
    reserveBalance(user, asset, delta);
    return;
  }

  if (delta < 0) {
    releaseReservedBalance(user, asset, Math.abs(delta));
  }
};

const getMarketQuote = (symbol) => {
  const marketData = getPrice(String(symbol || '').toUpperCase());

  if (!marketData || !marketData.price) {
    throw new BadRequestError(
      `No market data available for "${symbol}". Ensure the WebSocket feed is running.`
    );
  }

  const price = Number(marketData.price || 0);
  if (!Number.isFinite(price) || price <= 0) {
    throw new BadRequestError(`Invalid market price for "${symbol}"`);
  }

  const lastUpdateAt = Number(
    marketData.eventTime ||
    marketData.timestamp?.getTime?.() ||
    marketData.timestamp ||
    0
  );

  if (!Number.isFinite(lastUpdateAt) || Date.now() - lastUpdateAt > MAX_MARKET_DATA_STALE_MS) {
    throw new BadRequestError(
      `Market data for "${symbol}" is stale. Trading is temporarily paused until the live feed recovers.`
    );
  }

  const spread = Math.max(price * 0.0004, price * 0.0001);

  return {
    symbol: String(symbol || '').toUpperCase(),
    marketData,
    markPrice: price,
    bid: round(price - spread / 2, 8),
    ask: round(price + spread / 2, 8),
    spread: round(spread, 8),
  };
};

const waitForExecutionWindow = async ({ minimumMs = 120, maximumMs = 300 } = {}) => {
  const jitter = Math.floor(Math.random() * Math.max(1, maximumMs - minimumMs + 1));
  const delayMs = minimumMs + jitter;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return delayMs;
};

const estimateExecutionPrice = ({ quote, side, kind = 'MARKET', limitPrice = null }) => {
  const upperSide = String(side || '').toUpperCase();
  const fillBase = upperSide === 'BUY' ? quote.ask : quote.bid;
  const slippageRate = kind === 'MARKET' ? 0.0003 : 0.00008;
  const slippageApplied = round(fillBase * slippageRate, 8);

  let executionPrice = fillBase;
  if (upperSide === 'BUY') {
    executionPrice += slippageApplied;
  } else {
    executionPrice -= slippageApplied;
  }

  if (kind === 'LIMIT' && limitPrice != null) {
    executionPrice =
      upperSide === 'BUY'
        ? Math.min(Number(limitPrice), executionPrice)
        : Math.max(Number(limitPrice), executionPrice);
  }

  return {
    executionPrice: round(executionPrice, 8),
    spreadApplied: round(quote.spread, 8),
    slippageApplied,
  };
};

const validateProtectiveLevels = ({ side, entryPrice, stopLoss, takeProfit }) => {
  const numericEntry = Number(entryPrice || 0);
  const numericStop = Number(stopLoss || 0);
  const numericTakeProfit = Number(takeProfit || 0);
  const upperSide = String(side || '').toUpperCase();

  if (!numericEntry || !numericStop || !numericTakeProfit) {
    throw new BadRequestError('Stop loss and take profit are required for simulator orders');
  }

  if (!['BUY', 'SELL'].includes(upperSide)) {
    throw new BadRequestError('Side must be either BUY or SELL');
  }

  if (upperSide === 'BUY') {
    if (numericStop >= numericEntry) {
      throw new BadRequestError('For long trades, stop loss must be below entry');
    }
    if (numericTakeProfit <= numericEntry) {
      throw new BadRequestError('For long trades, take profit must be above entry');
    }
  }

  if (upperSide === 'SELL') {
    if (numericStop <= numericEntry) {
      throw new BadRequestError('For short trades, stop loss must be above entry');
    }
    if (numericTakeProfit >= numericEntry) {
      throw new BadRequestError('For short trades, take profit must be below entry');
    }
  }

  return {
    stopLoss: round(numericStop, 8),
    takeProfit: round(numericTakeProfit, 8),
  };
};

const calculateRiskPercent = ({ entryPrice, stopLoss, quantity, accountEquity }) => {
  const riskAmount = Math.abs(Number(entryPrice || 0) - Number(stopLoss || 0)) * Number(quantity || 0);
  const equity = Math.max(1, Number(accountEquity || 0));

  return round((riskAmount / equity) * 100, 4);
};

const enforceRiskLimit = ({ riskPercent }) => {
  if (Number(riskPercent || 0) > MAX_RISK_PERCENT) {
    throw new BadRequestError(
      `Risk too high. Max allowed risk is ${MAX_RISK_PERCENT}% of account equity per trade`
    );
  }
};

module.exports = {
  QUOTE_ASSETS,
  MAX_RISK_PERCENT,
  MAX_MARKET_DATA_STALE_MS,
  round,
  normalizeStrategy,
  parseSymbol,
  ensureWalletMaps,
  getAvailableBalance,
  getReservedBalance,
  setAvailableBalance,
  setReservedBalance,
  reserveBalance,
  releaseReservedBalance,
  adjustReservedBalance,
  getMarketQuote,
  waitForExecutionWindow,
  estimateExecutionPrice,
  validateProtectiveLevels,
  calculateRiskPercent,
  enforceRiskLimit,
};
