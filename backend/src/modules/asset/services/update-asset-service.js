const Asset = require('../../../schema/asset.model');
const AssetLogger = require('../asset-logger');

const updateAsset = async (id, assetData) => {
  const asset = await Asset.findByIdAndUpdate(id, assetData, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'name email');

  if (asset) {
    AssetLogger.info(`Asset updated: ${asset.symbol}`, { assetId: id });
  }

  return asset;
};

module.exports = { updateAsset };
