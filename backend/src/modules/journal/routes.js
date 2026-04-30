const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getJournalOverviewController,
} = require('./controllers/get-journal-overview-controller');
const {
  upsertJournalEntryController,
} = require('./controllers/upsert-journal-entry-controller');
const {
  deleteJournalEntryController,
} = require('./controllers/delete-journal-entry-controller');

const router = express.Router();

router.get('/', authenticate, getJournalOverviewController);
router.post('/', authenticate, upsertJournalEntryController);
router.patch('/:id', authenticate, upsertJournalEntryController);
router.delete('/:id', authenticate, deleteJournalEntryController);

module.exports = router;
