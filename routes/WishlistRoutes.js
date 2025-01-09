const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateWishlist, deleteWishlist, getAllWishlist} = require("../controllers/WishlistController")

router.post("/api/register-user/:user_id/:product_id", authenticateToken, CreateWishlist);
router.get('/api/Wishlists', authenticateToken, getAllWishlist);
router.delete('/api/delte_item', authenticateToken, deleteWishlist);

module.exports = router;