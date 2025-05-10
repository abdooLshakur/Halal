const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/Auth');

const {
  autoCreateMatch,
  shareContactInfo,
  getAllMatches
} = require('../controllers/MatchController');

router.post('/matches/auto-create', authenticateToken, autoCreateMatch);
router.get('/matches', authenticateToken, getAllMatches);
router.post('/matches/:matchId/share-contact', authenticateToken, shareContactInfo);

module.exports = router;
