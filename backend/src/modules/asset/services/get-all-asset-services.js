const Asset = require('../../../schema/asset.model');
const assetLogger = require('../asset-logger');

const getAllActiveAssets = async () => {
  assetLogger.debug('Fetching active assets');

  const assets = await Asset.find({ isActive: true })
    .sort({ createdAt: -1 });

  assetLogger.info(`Retrieved ${assets.length} active assets`);

  return assets;
};

module.exports = { getAllActiveAssets };
