const { getAllActiveAssets } = require('../../asset/services/get-all-asset-services');
const { getAllPrices } = require('../../../state/market.state');
const MarketTicker = require('../../../schema/market-ticker.model');

const getMarketTickers = async () => {
  const assets = await getAllActiveAssets();
  const prices = getAllPrices();
  const tickerDocs = await MarketTicker.find({
    symbol: { $in: assets.map((asset) => asset.symbol) },
  }).lean();
  const tickerBySymbol = new Map(tickerDocs.map((doc) => [doc.symbol, doc]));

  return assets.map((asset) => {
    const market = prices[asset.symbol] || {};
    const persisted = tickerBySymbol.get(asset.symbol) || {};

    return {
      id: asset._id,
      symbol: asset.symbol,
      baseAsset: asset.baseAsset,
      quoteAsset: asset.quoteAsset,
      type: asset.type,
      isActive: asset.isActive,
      price: market.price ?? persisted.price ?? null,
      open: market.open ?? persisted.open ?? null,
      high: market.high ?? persisted.high ?? null,
      low: market.low ?? persisted.low ?? null,
      volume: market.volume ?? persisted.volume ?? null,
      changePercent: market.changePercent ?? persisted.changePercent ?? null,
      openInterest: market.openInterest ?? persisted.openInterest ?? null,
      openInterestChangePercent:
        market.openInterestChangePercent ?? persisted.openInterestChangePercent ?? null,
      fundingRate: market.fundingRate ?? persisted.fundingRate ?? null,
      source: persisted.source || 'BINANCE_LIVE',
      timestamp: market.timestamp ?? persisted.timestamp ?? null,
    };
  });
};

module.exports = {
  getMarketTickers,
};
