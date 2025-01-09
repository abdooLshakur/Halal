const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateCategory, getmerchantcategory, deleteCategory, updateCategory, } = require("../controllers/CategoryController")

router.post("/api/create-category/:merchant_id", authenticateToken, upload.single('icon'), CreateCategory);
router.put('/api/update-category/:id', authenticateToken, upload.single('icon'), updateCategory);
router.get('/api/categories', authenticateToken, getmerchantcategory);
router.delete('/api/delete-category/:id', authenticateToken, deleteCategory);


module.exports = router;