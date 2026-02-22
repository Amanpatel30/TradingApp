const { assetService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { NotFoundError } = require('../../../utils/custom-error');

// @desc    Delete asset
// @route   DELETE /api/v1/assets/:id
// @access  Private
const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.deleteAsset(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  return ApiResponse.noContent(res);
});

module.exports = { deleteAsset };
