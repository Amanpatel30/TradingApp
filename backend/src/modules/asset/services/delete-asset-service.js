const Asset = require('../../../schema/asset.model');
const assetLogger = require('../asset-logger');

const deleteAsset = async (id) => {
  const asset = await Asset.findByIdAndDelete(id);

  if (asset) {
    assetLogger.info(`Asset deleted: ${asset.symbol}`, { assetId: id });
  }

  return asset;
};

module.exports = { deleteAsset };
