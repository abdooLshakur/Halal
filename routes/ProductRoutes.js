const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');
const {updateproduct,deleteProduct, GetSingleproduct, GetAllproduct, CreateProduct, TrendingProduct, featuredProduct,} = require("../controllers/ProductController");

router.post("/api/create-product/:merchant_id/:category_id",authenticateToken,upload.array('images'),CreateProduct)
router.get("/api/products",authenticateToken, GetAllproduct)
router.get("/api/singleproduct/:id",authenticateToken, GetSingleproduct)
router.put("/api/update-product/:id",authenticateToken, upload.single('images'),updateproduct)
router.put("/api/add_trending/:userid/:productid",authenticateToken, TrendingProduct);
router.put("/api/add_featured/:userid/:productid",authenticateToken, featuredProduct);
router.delete("/api/delete-product/:id",authenticateToken, deleteProduct)

module.exports = router;