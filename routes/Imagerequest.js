const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/Auth');

const {
  requestImageAccess,
  respondToImageRequest,
  getImageRequests
} = require("../controllers/ImagerequestController");

// Request to view image
router.post("/image-access-request", authenticateToken, requestImageAccess);

// Respond to request (approve/reject)
router.put("/update-image-request/:requestId", authenticateToken, respondToImageRequest);

// Get target user's details including access status
router.get("/image-request/:userId", authenticateToken, getImageRequests);

module.exports = router;
