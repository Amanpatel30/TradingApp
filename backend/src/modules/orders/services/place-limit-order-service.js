const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');
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
 * Place a LIMIT order (BUY or SELL).
 * NOTE: As per requirements, wallet balances are checked but NOT deducted until execution.
 *
 * @param {Object} params
 * @param {String} params.userId     - Authenticated user's _id
 * @param {String} params.symbol     - Trading pair, e.g. "BTCUSDT"
 * @param {String} params.side       - "BUY" or "SELL"
 * @param {Number} params.quantity   - Amount of base asset to trade
 * @param {Number} params.limitPrice - Limit price for the order
 * @returns {Object} Created order
 */
const placeLimitOrder = async ({ userId, symbol, side, quantity, limitPrice }) => {
  // ── Validate inputs ────────────────────────────────────────────
  if (!symbol || !side || !quantity || !limitPrice) {
    throw new BadRequestError('Please provide symbol, side, quantity, and limitPrice');
  }

  const upperSide = side.toUpperCase();
  if (!['BUY', 'SELL'].includes(upperSide)) {
    throw new BadRequestError('Side must be either BUY or SELL');
  }

  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new BadRequestError('Quantity must be a positive number');
  }

  if (typeof limitPrice !== 'number' || limitPrice <= 0) {
    throw new BadRequestError('Limit Price must be a positive number');
  }

  // ── Parse symbol ───────────────────────────────────────────────
  const { baseAsset, quoteAsset } = parseSymbol(symbol);

  // ── Fetch user ─────────────────────────────────────────────────
  const user = await User.findById(userId);
  if (!user) {
    throw new BadRequestError('User not found');
  }
  
  // Ensure wallet exists
  if (!user.wallet || !(user.wallet instanceof Map)) {
    user.wallet = new Map([['USDT', 10000]]);
  }

  // ── Check Balance (Validation Only - No Deduction) ─────────────
  const totalValue = limitPrice * quantity;

  if (upperSide === 'BUY') {
    const quoteBalance = user.wallet.get(quoteAsset) || 0;
    if (quoteBalance < totalValue) {
       throw new BadRequestError(
        `Insufficient ${quoteAsset} balance. Required: ${totalValue.toFixed(8)}, Available: ${quoteBalance.toFixed(8)}`
      );
    }
  } else {
    // SELL
    const baseBalance = user.wallet.get(baseAsset) || 0;
    if (baseBalance < quantity) {
      throw new BadRequestError(
        `Insufficient ${baseAsset} balance. Required: ${quantity.toFixed(8)}, Available: ${baseBalance.toFixed(8)}`
      );
    }
  }

  // ── Create Order ───────────────────────────────────────────────
  const order = await Order.create({
    user: userId,
    symbol: symbol.toUpperCase(),
    side: upperSide,
    type: 'LIMIT',
    quantity,
    price: limitPrice, // Price field stores execution price for Market, limit price for Limit? 
                       // Check model: price is required. limitPrice is required for LIMIT.
                       // Typically 'price' in Order model might mean "requested price" or "avg fill price".
                       // Model has `price` AND `limitPrice`.
                       // Let's store limitPrice in both for consistency or just `limitPrice`.
                       // The `price` field in model is required. I'll set it to limitPrice for now.
    limitPrice,
    total: totalValue,
    status: 'OPEN',
    realizedPnL: 0,
  });

  return {
    order: {
      id: order._id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      limitPrice: order.limitPrice,
      total: order.total,
      status: order.status,
      realizedPnL: order.realizedPnL,
      createdAt: order.createdAt,
    }
  };
};

module.exports = { placeLimitOrder };
