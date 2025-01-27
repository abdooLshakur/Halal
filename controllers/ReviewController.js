const User = require("../models/UserModel");
const Reviews = require("../models/ReviewModel");
const Product = require("../models/ProductModel");

const CreateReview = async(req, res) => {
    try {
      const {message } = req.body;
      
      const id = req.params.id;
      const productid = req.params.productid;
     
      const check_user = await User.findById(id).select("_id first_name last_name avatar");
      if (!check_user) {
        return res.status(404).json({ success: false, message: "User ID does not exist" });
      }


      const check_product = await Product.findById(productid).select("_id");
      if (!check_product) {
        return res.status(404).json({ success: false, message: "product  does not exist" });
      }


        const New_Review = {message, user_id: check_user._id, product_id: check_product._id, user_name: check_user.first_name + " " + check_user.last_name, user_avatar:check_user.avatar };
        const Review = await new Reviews(New_Review).save();
        res.json({
            success: true,
            message: "Review created Successfully",
            data: Review
        });
    } catch (err) {
        res.json({
            success: false,
            message: "Failed to create Review",
            error: err.message,
        })
    }
};

const getAllReviews = (req, res) => {

  Reviews.find({}, { })
    .then((resp) => {
      res.json({
        success: true,
        message: "All Reviews",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch Reviews",
        error: err.massage,
      });
    });
};


const updateReview = async (req, res) => {
 
 try {
  const id = req.params.id;
  const resp = await Reviews.findByIdAndUpdate(
    id,
    {
      message: req.body.message,
    },
    { new: true }
  )
  res.json({
    success: true,
    message: "Review Updated Successfully",
    data: resp,
  });
 } catch (err) {
  res.json({
    success: false,
    message: "Failed to Update Review",
    error: err.massage,
  });
 }
    
   
   
};


const deleteReview = (res, req) => {
   const id = req.params.id;
  Reviews.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "Review Deleted Successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Delete Review",
        error: err.massage,
      });
    });
};

module.exports = {
  CreateReview,
  getAllReviews,
  updateReview,
  deleteReview
};