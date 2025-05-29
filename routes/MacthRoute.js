const express = require('express');
const router = express.Router();
const Protected = require('../middleware/Aminauth');

const {
  autoCreateMatch,
  shareContactInfo,
  getAllMatches
} = require('../controllers/MatchController');

router.post('/matches/auto-create', Protected, autoCreateMatch);
router.get('/matches', Protected, getAllMatches);
router.post('/matches/:matchId/share-contact', Protected, shareContactInfo);

module.exports = router;
