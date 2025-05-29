const Gallerys = require("../models/Gallery");

const CreateGallery = async(req, res) => {
    try {
      const { gallery_header, gallery_location,} = req.body;
      const Gallerypath = req.file ? req.file.path : null;

        const New_Gallery = { gallery_img:Gallerypath, gallery_header, gallery_location,};
        const Gallery = await new Gallerys(New_Gallery).save();
        res.json({
            success: true,
            message: "Gallery created Successfully",
            data: Gallery
        });
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to create Gallery",
            error: err.message,
        })
    }
};

const getAllGallery = (req, res) => {
 
  Gallerys.find({}, { })
    .then((resp) => {
      res.json({
        success: true,
        message: "All Gallery",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch Gallery",
        error: err.massage,
      });
    });
};


const updateGallery = async (req, res) => {
    try {
      const id = req.params.id;
      const Gallerypath = req.file?.path;
  
      const updateData = {
        gallery_header: req.body.gallery_header,
        gallery_location: req.body.gallery_location,
      };
  
      if (Gallerypath) {
        updateData.gallery_img = Gallerypath;
      }
  
      const updatedGallery = await Gallerys.findByIdAndUpdate(id, updateData, { new: true });
  
      res.json({
        success: true,
        message: "Gallery Updated Successfully",
        data: updatedGallery,
      });
  
    } catch (err) {
      res.json({
        success: false,
        message: "Failed to Update Gallery",
        error: err.message,
      });
    }
  };
  


const deleteGallery = (req, res) => {
 
  const id = req.params.id;

  if (!id) {
      return res.status(400).json({
          success: false,
          message: "Gallery ID is required",
      });
  }

  Gallerys.findByIdAndDelete(id)
      .then((deletedGallery) => {
          if (!deletedGallery) {
              return res.status(404).json({
                  success: false,
                  message: "Gallery not found",
              });
          }
          res.status(200).json({
              success: true,
              message: "Gallery deleted successfully",
          });
      })
      .catch((err) => {
          res.status(500).json({
              success: false,
              message: "Failed to delete Gallery",
              error: err.message, 
          });
      });
};

module.exports = {
  CreateGallery,
  getAllGallery,
  updateGallery,
  deleteGallery
};