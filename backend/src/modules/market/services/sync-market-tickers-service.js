const Asset = require('../../../schema/asset.model');
const MarketTicker = require('../../../schema/market-ticker.model');

const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com';

const toJson = async (response) => {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.msg || payload?.message || `Binance request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const fetchPremiumIndexMap = async () => {
  const response = await fetch(`${BINANCE_FUTURES_BASE_URL}/fapi/v1/premiumIndex`);
  const payload = await toJson(response);
  const rows = Array.isArray(payload) ? payload : [payload];

  return new Map(
    rows
      .filter((row) => row?.symbol)
      .map((row) => [
        row.symbol,
        {
          fundingRate: Number(row.lastFundingRate || 0) * 100,
        },
      ])
  );
};

const fetchOpenInterest = async (symbol) => {
  const response = await fetch(
    `${BINANCE_FUTURES_BASE_URL}/fapi/v1/openInterest?symbol=${symbol}`
  );
  const payload = await toJson(response);
  return Number(payload?.openInterest || 0);
};

const persistSpotTicker = async (asset, marketData) => {
  if (!asset?.symbol || !marketData?.price) {
    return null;
  }

  await MarketTicker.findOneAndUpdate(
    { symbol: asset.symbol },
    {
      $set: {
        baseAsset: asset.baseAsset,
        quoteAsset: asset.quoteAsset,
        type: asset.type,
        isActive: asset.isActive,
        price: Number(marketData.price),
        open: Number(marketData.open),
        high: Number(marketData.high),
        low: Number(marketData.low),
        volume: Number(marketData.volume),
        changePercent: Number(marketData.changePercent),
        timestamp: marketData.timestamp || new Date(),
        source: 'BINANCE_LIVE',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const refreshDerivativeMetrics = async (symbols = []) => {
  const uniqueSymbols = [...new Set(symbols.filter(Boolean))];
  if (!uniqueSymbols.length) {
    return [];
  }

  const activeAssets = await Asset.find({ symbol: { $in: uniqueSymbols } }).lean();
  const assetBySymbol = new Map(activeAssets.map((asset) => [asset.symbol, asset]));
  const existingRows = await MarketTicker.find({ symbol: { $in: uniqueSymbols } }).lean();
  const existingBySymbol = new Map(existingRows.map((row) => [row.symbol, row]));
  const premiumIndexMap = await fetchPremiumIndexMap();

  const now = new Date();
  const updates = await Promise.all(
    uniqueSymbols.map(async (symbol) => {
      try {
        const [openInterest, premiumIndex] = await Promise.all([
          fetchOpenInterest(symbol),
          Promise.resolve(premiumIndexMap.get(symbol) || null),
        ]);

        const previousOpenInterest = Number(existingBySymbol.get(symbol)?.openInterest || 0);
        const openInterestChangePercent = previousOpenInterest
          ? ((openInterest - previousOpenInterest) / previousOpenInterest) * 100
          : 0;
        const asset = assetBySymbol.get(symbol);

        await MarketTicker.findOneAndUpdate(
          { symbol },
          {
            $set: {
              baseAsset: asset?.baseAsset || symbol.replace('USDT', ''),
              quoteAsset: asset?.quoteAsset || 'USDT',
              type: asset?.type || 'CRYPTO',
              isActive: asset?.isActive ?? true,
              openInterest,
              openInterestChangePercent,
              fundingRate: Number(premiumIndex?.fundingRate || 0),
              source: 'BINANCE_LIVE',
              lastDerivativesSyncAt: now,
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );

        return { symbol, openInterest, openInterestChangePercent };
      } catch (error) {
        return {
          symbol,
          error: error.message,
        };
      }
    })
  );

  return updates;
};

module.exports = {
  persistSpotTicker,
  refreshDerivativeMetrics,
};
