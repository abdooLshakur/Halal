const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/Auth');

const { deleteReview, updateReview, getAllReviews, CreateReview,} = require("../controllers/ReviewController");

router.post("/api/add_review/:id/:productid", authenticateToken, CreateReview)
router.get("/api/reviews", authenticateToken, getAllReviews)
router.put("/api/edit-review/:id", authenticateToken, updateReview)
router.delete("/api/delete-review",authenticateToken, deleteReview)

module.exports = router;