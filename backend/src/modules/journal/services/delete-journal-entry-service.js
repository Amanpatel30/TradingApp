const JournalEntry = require('../../../schema/journal-entry.model');
const { BadRequestError } = require('../../../utils/custom-error');

const deleteJournalEntry = async (userId, entryId) => {
  const deleted = await JournalEntry.findOneAndDelete({
    _id: entryId,
    user: userId,
  }).lean();

  if (!deleted) {
    throw new BadRequestError('Journal entry not found');
  }

  return deleted;
};

module.exports = {
  deleteJournalEntry,
};
