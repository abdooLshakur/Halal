const Wishlist = require("../models/WishlistModel")
const users = require("../models/UserModel")
const product = require("../models/ProductModel")
const CreateWishlist = async (req, res) => {
  try {
    const product_id = req.params.user_id;
    const user_id = req.params.product_id;
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Merchant or Admin not logged in",
      });
    }
    const check_user = await users.findOne({user_id});
    if (!check_user) {
      res.json({
        success: false,
        messae: "User Id Deos Not Exists",
      });
      return
    }
    const check_product = await product.findOne({product_id});
    if (!check_product) {
      res.json({
        success: false,
        messae: "Product Deos Not Exists",
      });
      return
    }
    const New_Wishlist = check_product
    const Wishlist = await new Wishlist(New_Wishlist).save();
    res.json({
      success: true,
      message: "Wishlist created Successfully",
      data: Wishlist
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to create Wishlist",
      error: err.message,
    })
  }
};

const getAllWishlist = (req, res) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
  Wishlist.find({}, {})
    .then((resp) => {
      res.json({
        success: true,
        message: "All Wishlist",
        data: resp,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Fetch Wishlist",
        error: err.massage,
      });
    });
};

const deleteWishlist = (res, req) => {
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }
  const id = req.params.id;
  Wishlist.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "Wishlist Deleted Successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to Delete Wishlist",
        error: err.massage,
      });
    });
};

module.exports = {
  CreateWishlist,
  getAllWishlist,
  deleteWishlist
}; 