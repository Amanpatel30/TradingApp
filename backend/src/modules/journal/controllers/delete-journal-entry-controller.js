const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { deleteJournalEntry } = require('../services/delete-journal-entry-service');

const deleteJournalEntryController = asyncHandler(async (req, res) => {
  await deleteJournalEntry(req.user._id, req.params.id);
  return ApiResponse.success(res, null, 'Journal entry deleted successfully');
});

module.exports = {
  deleteJournalEntryController,
};
