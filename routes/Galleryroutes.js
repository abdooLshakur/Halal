const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const Protected = require('../middleware/Aminauth');
const { deleteGallery, updateGallery, getAllGallery, CreateGallery, } = require("../controllers/Gallerycontroller");

router.post("/create-Gallery", Protected, upload.single('Gallery_img'), CreateGallery);
router.get("/Gallerys", Protected, getAllGallery);
router.put("/update-Gallery/:id", Protected, upload.single('Gallery_img'), updateGallery);
router.delete("/delete-Gallery/:id", Protected, deleteGallery);

module.exports = router;