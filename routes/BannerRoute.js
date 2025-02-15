const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');
const { deleteBanner, updateBanner, getAllBanner, CreateBanner, } = require("../controllers/BannerController");

router.post("/api/create-banner", authenticateToken, upload.single('banner_img'), CreateBanner);
router.get("/api/banners",  getAllBanner);
router.put("/api/update-banner/:id", authenticateToken, upload.single('banner_img'), updateBanner);
router.delete("/api/delete-banner/:id", authenticateToken, deleteBanner);

module.exports = router;