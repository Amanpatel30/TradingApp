const User = require('../../../schema/user.model');
const Order = require('../../../schema/order.model');

/**
 * Checks and executes matching LIMIT orders for a given symbol and current price.
 */
const checkAndExecuteOrders = async (symbol, currentPrice) => {
  const openOrders = await Order.find({
    symbol: symbol.toUpperCase(),
    status: 'OPEN',
    type: 'LIMIT',
  });

  if (!openOrders.length) return;

  const normalizedCurrent = Number(currentPrice.toFixed(2));

  console.log(
    `Checking ${openOrders.length} open orders for ${symbol} at ${normalizedCurrent}`
  );

  for (const order of openOrders) {
    try {
      await processOrder(order, normalizedCurrent);
    } catch (err) {
      console.error(
        `Failed to process order ${order._id}:`,
        err.message
      );
    }
  }
};

const processOrder = async (order, currentPrice) => {
  const isBuy = order.side === 'BUY';
  const isSell = order.side === 'SELL';

  const normalizedLimit = Number(order.limitPrice.toFixed(2));
  let shouldExecute = false;

  console.log("Matched BUY order:", order._id, "Current Price:", currentPrice, "Limit Price:", normalizedLimit);
  if (isBuy && currentPrice <= normalizedLimit) {
    shouldExecute = true;

    
  }

  if (isSell && currentPrice >= normalizedLimit) {
    shouldExecute = true;
    
  }

  if (!shouldExecute) return;
  

  // 🔥 IMPORTANT: Mark FILLED FIRST (prevents double execution)
  order.status = 'FILLED';

  const user = await User.findById(order.user);
  if (!user) {
    order.status = 'CANCELLED';
    await order.save();
    return;
  }

  const quantity = Number(order.quantity.toFixed(8));
  const executionPrice = currentPrice;
  const total = Number((quantity * executionPrice).toFixed(6));

  // Parse base/quote
  const QUOTE_ASSETS = ['BUSD', 'USDT', 'USDC', 'BTC', 'ETH', 'BNB'];
  let baseAsset = '';
  let quoteAsset = '';

  const upperSymbol = order.symbol.toUpperCase();

  for (const quote of QUOTE_ASSETS) {
    if (upperSymbol.endsWith(quote)) {
      baseAsset = upperSymbol.slice(0, -quote.length);
      quoteAsset = quote;
      break;
    }
  }

  if (!baseAsset || !quoteAsset) {
    order.status = 'CANCELLED';
    await order.save();
    return;
  }

  // BUY
  if (isBuy) {
    const quoteBalance = Number(
      (user.wallet.get(quoteAsset) || 0).toFixed(6)
    );

    if (quoteBalance < total) {
      order.status = 'CANCELLED';
      await order.save();
      return;
    }

    user.wallet.set(quoteAsset, quoteBalance - total);
    user.wallet.set(
      baseAsset,
      Number(((user.wallet.get(baseAsset) || 0) + quantity).toFixed(8))
    );
  }

  // SELL
  if (isSell) {
    const baseBalance = Number(
      (user.wallet.get(baseAsset) || 0).toFixed(8)
    );

    if (baseBalance < quantity) {
      order.status = 'CANCELLED';
      await order.save();
      return;
    }

    user.wallet.set(baseAsset, baseBalance - quantity);
    user.wallet.set(
      quoteAsset,
      Number(((user.wallet.get(quoteAsset) || 0) + total).toFixed(6))
    );
  }

  order.price = executionPrice;
  order.total = total;

  await user.save();
  await order.save();

  console.log(`✅ Order ${order._id} FILLED at ${executionPrice}`);
};

module.exports = { checkAndExecuteOrders };