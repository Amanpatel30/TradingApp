const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getJournalOverview } = require('../services/get-journal-overview-service');

const getJournalOverviewController = asyncHandler(async (req, res) => {
  const data = await getJournalOverview(req.user._id);
  return ApiResponse.success(res, data, 'Journal overview retrieved successfully');
});

module.exports = {
  getJournalOverviewController,
};
