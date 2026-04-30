const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { upsertJournalEntry } = require('../services/upsert-journal-entry-service');

const upsertJournalEntryController = asyncHandler(async (req, res) => {
  const data = await upsertJournalEntry(req.user._id, req.body || {}, req.params.id || null);
  return ApiResponse.success(res, data, 'Journal entry saved successfully');
});

module.exports = {
  upsertJournalEntryController,
};
