const { getAllActiveAssets } = require('./get-all-asset-services');
const { getAssetById } = require('./get-asset-by-id-service');
const { createAsset } = require('./create-asset-service');
const { updateAsset } = require('./update-asset-service');
const { deleteAsset } = require('./delete-asset-service');

class AssetService {
  async getAllAssets(queryParams) {
    return await getAllActiveAssets(queryParams);
  }

  async getAssetById(id) {
    return await getAssetById(id);
  }

  async createAsset(assetData, userId) {
    return await createAsset(assetData, userId);
  }

  async updateAsset(id, assetData) {
    return await updateAsset(id, assetData);
  }

  async deleteAsset(id) {
    return await deleteAsset(id);
  }
}

module.exports = { assetService: new AssetService() };


