const Asset = require('../../../schema/asset.model');

const getActiveSymbols = async () => {
  const assets = await Asset.find(
    { isActive: true },
    { symbol: 1, _id: 0 }
  );

  return assets.map(asset => asset.symbol);
};

module.exports = { getActiveSymbols };
