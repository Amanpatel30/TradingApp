const Asset = require('../../../schema/asset.model');

const getAssetById = async (id) => {
  return await Asset.findById(id).populate('createdBy', 'name email');
};

module.exports = { getAssetById };
