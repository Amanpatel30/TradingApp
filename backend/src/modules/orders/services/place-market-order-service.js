const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
const { getPrice } = require('../../../state/market.state');
const { BadRequestError } = require('../../../utils/custom-error');

/**
 * Known quote assets used to split a trading symbol into base + quote.
 * Ordered longest-first so "BUSD" is matched before "BTC" in edge cases.
 */
const QUOTE_ASSETS = ['BUSD', 'USDT', 'USDC', 'BTC', 'ETH', 'BNB'];

/**
 * Split a trading symbol (e.g. "BTCUSDT") into { baseAsset, quoteAsset }.
 * Tries each known quote suffix — first match wins.
 */
const parseSymbol = (symbol) => {
  const upper = symbol.toUpperCase();

  for (const quote of QUOTE_ASSETS) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      return {
        baseAsset: upper.slice(0, -quote.length),
        quoteAsset: quote,
      };
    }
  }

  throw new BadRequestError(
    `Unable to parse symbol "${symbol}". Supported quote assets: ${QUOTE_ASSETS.join(', ')}`
  );
};

/**
 * Place a market order (BUY or SELL) and update the user's wallet.
 *
 * @param {Object} params
 * @param {String} params.userId   - Authenticated user's _id
 * @param {String} params.symbol   - Trading pair, e.g. "BTCUSDT"
 * @param {String} params.side     - "BUY" or "SELL"
 * @param {Number} params.quantity - Amount of base asset to trade
 * @returns {Object} Created order + updated wallet snapshot
 */
const placeMarketOrder = async ({ userId, symbol, side, quantity }) => {
  // ── Validate inputs ────────────────────────────────────────────
  if (!symbol || !side || !quantity) {
    throw new BadRequestError('Please provide symbol, side, and quantity');
  }

  const upperSide = side.toUpperCase();
  if (!['BUY', 'SELL'].includes(upperSide)) {
    throw new BadRequestError('Side must be either BUY or SELL');
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new BadRequestError('Quantity must be a positive number');
  }

  // ── Parse symbol ───────────────────────────────────────────────
  const { baseAsset, quoteAsset } = parseSymbol(symbol);

  // ── Get current market price ───────────────────────────────────
  const marketData = getPrice(symbol.toUpperCase());

  if (!marketData || !marketData.price) {
    throw new BadRequestError(
      `No market data available for "${symbol}". Ensure the WebSocket feed is running.`
    );
  }

  const price = parseFloat(marketData.price);
  if (isNaN(price) || price <= 0) {
    throw new BadRequestError(`Invalid market price for "${symbol}"`);
  }

  // ── Fetch user with wallet ─────────────────────────────────────
  const user = await User.findById(userId);
  if (!user) {
    throw new BadRequestError('User not found');
  }

  // Ensure wallet exists (safety net for legacy users)
  if (!user.wallet || !(user.wallet instanceof Map)) {
    user.wallet = new Map([['USDT', 10000]]);
  }

  // ── Execute trade ──────────────────────────────────────────────
  const total = parseFloat((quantity * price).toFixed(6));
  let realizedPnL = 0;

  if (upperSide === 'BUY') {
    // Deduct quote asset, credit base asset
    const quoteBalance = user.wallet.get(quoteAsset) || 0;

    if (quoteBalance < total) {
      throw new BadRequestError(
        `Insufficient ${quoteAsset} balance. Required: ${total.toFixed(8)}, Available: ${quoteBalance.toFixed(8)}`
      );
    }

    user.wallet.set(quoteAsset, quoteBalance - total);
    user.wallet.set(baseAsset, (user.wallet.get(baseAsset) || 0) + quantity);
  } else {
    // SELL — Deduct base asset, credit quote asset
    const baseBalance = user.wallet.get(baseAsset) || 0;

    if (baseBalance < quantity) {
      throw new BadRequestError(
        `Insufficient ${baseAsset} balance. Required: ${quantity.toFixed(8)}, Available: ${baseBalance.toFixed(8)}`
      );
    }

    // ── Calculate realized PnL from historical BUY orders ──────
    const buyOrders = await Order.find({
      user: userId,
      symbol: symbol.toUpperCase(),
      side: 'BUY',
      status: 'FILLED',
    }).lean();

    let totalBuyQuantity = 0;
    let totalBuyValue = 0;

    for (const o of buyOrders) {
      totalBuyQuantity += o.quantity;
      totalBuyValue += o.total;
    }

    const avgBuyPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0;
    realizedPnL = parseFloat(((price - avgBuyPrice) * quantity).toFixed(6));

    user.wallet.set(baseAsset, baseBalance - quantity);
    user.wallet.set(quoteAsset, (user.wallet.get(quoteAsset) || 0) + total);
  }

  // ── Persist wallet changes ─────────────────────────────────────
  user.markModified('wallet');
  await user.save();

  // ── Create order record ────────────────────────────────────────
  const order = await Order.create({
    user: userId,
    symbol: symbol.toUpperCase(),
    side: upperSide,
    type: 'MARKET',
    quantity,
    price,
    total,
    status: 'FILLED',
    realizedPnL,
  });

  return {
    order: {
      id: order._id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      total: order.total,
      status: order.status,
      realizedPnL: order.realizedPnL,
      createdAt: order.createdAt,
    },
    wallet: Object.fromEntries(user.wallet),
  };
};

module.exports = { placeMarketOrder };
