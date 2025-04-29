const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/Auth');
const {
  expressInterest,
  respondToInterest,
  getInterestRequest,
  deleteInterestRequest
} = require("../controllers/IntrestController");

// Express interest
router.post("/express-interest/:id", authenticateToken, expressInterest);

// Respond to interest
router.put("/update-request/:id", authenticateToken, respondToInterest);

// Get all interest requests for a user
router.get("/interests-requests/:id", authenticateToken, getInterestRequest);

// Delete an interest request
router.delete("/delete-interest-request/:id", authenticateToken, deleteInterestRequest);

module.exports = router;
