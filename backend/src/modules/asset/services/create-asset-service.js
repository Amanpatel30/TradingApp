const Asset = require("../../../schema/asset.model");
const { ConflictError } = require("../../../utils/custom-error");
const assetLogger = require('../asset-logger');

const createAsset = async (Assetdata,userId) => {
  const existing = await Asset.findOne({ symbol: Assetdata.symbol });

  if (existing) {
    throw new ConflictError("Asset already exists");
  }

  const asset = await Asset.create({
    ...Assetdata,
    createdBy: userId,
  });

  assetLogger.info(`Asset created: ${asset.symbol}`, { assetId: asset._id, userId });

  return asset;
};

module.exports = { createAsset };
