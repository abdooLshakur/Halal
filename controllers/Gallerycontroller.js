const Gallerys = require("../models/Gallery");

const CreateGallery = async (req, res) => {
  try {
    const { gallery_header, gallery_location, gallery_description } = req.body;

    const files = req.files; // Expecting multiple files
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const gallery_imgs = files.map(file => file.path);

    const New_Gallery = {
      gallery_imgs,
      gallery_header,
      gallery_location,
      gallery_description,
    };

    const Gallery = await new Gallerys(New_Gallery).save();

    res.json({
      success: true,
      message: "Gallery created successfully",
      data: Gallery,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to create gallery",
      error: err.message,
    });
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
    const newFiles = req.files;

    const updateData = {
      gallery_header: req.body.gallery_header,
      gallery_location: req.body.gallery_location,
      gallery_description: req.body.gallery_description,
    };

    if (newFiles && newFiles.length > 0) {
      updateData.gallery_imgs = newFiles.map(file => file.path);
    }

    const updatedGallery = await Gallerys.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      message: "Gallery updated successfully",
      data: updatedGallery,
    });

  } catch (err) {
    res.json({
      success: false,
      message: "Failed to update gallery",
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