const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const Protected = require('../middleware/Aminauth');
const { deleteGallery, updateGallery, getAllGallery, CreateGallery, } = require("../controllers/Gallerycontroller");

router.post("/create-Gallery", Protected, upload.array("Gallery_img", 20) , CreateGallery);
router.get("/Gallerys", getAllGallery);
router.put("/update-Gallery/:id", Protected, upload.array("Gallery_img", 20) , updateGallery);
router.delete("/delete-Gallery/:id", Protected, deleteGallery);

module.exports = router;