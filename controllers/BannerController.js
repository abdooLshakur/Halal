const Banners = require("../models/BannerModel");

const CreateBanner = async(req, res) => {
    try {
      const { banner_header, banner_descp, banner_link} = req.body;
      const Bannerpath = req.file ? req.file.path : null;

        const New_banner = { banner_img:Bannerpath, banner_header, banner_descp, banner_link };
        const Banner = await new Banners(New_banner).save();
        res.json({
            success: true,
            message: "Banner created Successfully",
            data: Banner
        });
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to create Banner",
            error: err.message,
        })
    }
};

const getAllBanner = (req, res) => {
 
  Banners.find({}, { })
    .then((resp) => {
      res.json({
        success: true,
        message: "All Banner",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch Banner",
        error: err.massage,
      });
    });
};


const updateBanner = async (req, res) => {

 try {
  const id = req.params.id;
  const Bannerpath = req.file ? req.file.path : null;
  const resp = await Banners.findByIdAndUpdate(
    id,
    {
      banner_img: Bannerpath,
      banner_link: req.body.banner_link,
      banner_descp:req.body. banner_descp,
      banner_header: req.body.banner_header,
    },
    { new: true }
  )
  res.json({
    success: true,
    message: "Banner Updated Successfully",
    data: resp,
  });
 } catch (err) {
  res.json({
    success: false,
    message: "Failed to Update Banner",
    error: err.massage,
  });
 }
    
   
   
};


const deleteBanner = (req, res) => {
 
  const id = req.params.id;

  if (!id) {
      return res.status(400).json({
          success: false,
          message: "Banner ID is required",
      });
  }

  Banners.findByIdAndDelete(id)
      .then((deletedBanner) => {
          if (!deletedBanner) {
              return res.status(404).json({
                  success: false,
                  message: "Banner not found",
              });
          }
          res.status(200).json({
              success: true,
              message: "Banner deleted successfully",
          });
      })
      .catch((err) => {
          res.status(500).json({
              success: false,
              message: "Failed to delete Banner",
              error: err.message, 
          });
      });
};

module.exports = {
  CreateBanner,
  getAllBanner,
  updateBanner,
  deleteBanner
};