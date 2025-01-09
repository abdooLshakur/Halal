const Product = require("../models/ProductModel");
const Merchant = require("../models/MerchantModel");
const Category = require("../models/CategoryModel");

const CreateProduct = async (req, res) => {
  try {
    const merchant_id = req.params.merchant_id;
    const category_id = req.params.category_id;

    const checkIfMerchant = await Merchant.findById(merchant_id);
    const checkIfCategoryExists = await Category.findById(category_id);

    if (!checkIfMerchant) {
      res.json({
        success: false,
        message: "Merchant does not exist",
      });
      return;
    }

    if (!checkIfCategoryExists) {
      res.json({
        success: false,
        message: "Category does not exist",
      });
      return;
    }

    const imagesPath = req.file ? req.file.path : null;

    const newProduct = new Product({
      merchant_id: checkIfMerchant._id,
      category_id: checkIfCategoryExists._id,
      title: req.body.title,
      descp: req.body.descp,
      images: imagesPath,
      price: req.body.price,
      currency: req.body.currency,
      brand: req.body.brand,
      quantity: req.body.quantity,
      min_qty: req.body.min_qty,
      max_qty: req.body.max_qty,
      discount: req.body.discount,
      shipping_locations: req.body.shipping_locations,
    });

    const resp = await newProduct.save();
    res.json({ success: true, message: "Product created successfully", data: resp });

  } catch (err) {
    res.json({
      success: false,
      message: "Failed to create product",
      error: err.message,
    });
  }
};

const GetAllproduct = async (req, res) => {
  try {
    const resp = await Product.find({}, {});  

  return res.json({
    success: true,
    message: "All Products",
    data: resp,
  });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Failed to Fetch Products",
      error: err.message, 
    });
  }
  
};

const GetSingleproduct = async (req, res) => {
  try {
    const id = req.params.product_id
    const resp = await Product.findOne(id)
    res.json({
      success: true,
      message: "single Product",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch single Product",
      error: err.massage,
    });
  }
};

const updateproduct = async (req, res) => {
  try {
    const id = req.params.id;
    const imagesPath = req.file ? req.file.path : null;

    const resp = await Product.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
        descp: req.body.descp,
        images: imagesPath,
        price: req.body.price,
        currency: req.body.currency,
        brand: req.body.brand,
        quantity: req.body.quantity,
        min_qty: req.body.min_qty,
        max_qty: req.body.max_qty,
        discount: req.body.discount,
        shipping_locations: req.body.shipping_locations,
      },
      { new: true }
    )

    if (!id) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({
      success: true,
      message: "Product Updated Successfully",
      data: resp
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Update Product",
      error: err.massage,
    });
  }



};

const TrendingProduct = async (req, res) => {
  try {
    const Merchantid = req.params.Merchantid;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    if (check_merchant.is_verified !== true) { 
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
    console.log('is_verified:', check_merchant.is_verified);

  
    // Update the product's trending status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_trending: true },
      { new: true } // Returns the updated document
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product added to trending successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};

const featuredProduct = async (req, res) => {
  try {
    const Merchantid = req.params.Merchantid;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified (ensure proper Boolean comparison)
    if (check_merchant.is_verified !== true) {  // If it's a Boolean field
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_featured: true },
      { new: true } // Returns the updated document
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product added to Featured successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};

const RemovefromTrending = async (req, res) => {
  try {
    const Merchantid = req.params.Merchantid;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified (ensure proper Boolean comparison)
    if (check_merchant.is_verified !== true) {  // If it's a Boolean field
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_featured: false },
      { new: true } // Returns the updated document
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product removed from Featured successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};
const RemovefromFeatured = async (req, res) => {
  try {
    const Merchantid = req.params.Merchantid;
    const productid = req.params.productid;
  
    // Check if the merchant exists
    const check_merchant = await Merchant.findById(Merchantid);
    if (!check_merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }
  
    // Check if the merchant is verified (ensure proper Boolean comparison)
    if (check_merchant.is_verified !== true) {  // If it's a Boolean field
      return res.status(403).json({
        success: false,
        message: "Merchant not authorized",
      });
    }
  
    // Update the product's featured status
    const updatedProduct = await Product.findByIdAndUpdate(
      productid,
      { is_featured: false },
      { new: true } // Returns the updated document
    );
  
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
  
    // Success response
    return res.status(200).json({
      success: true,
      message: "Product remove from Featured successfully",
      product: updatedProduct,
    });
  } catch (err) {
    // Catch and json error details
    return res.status(500).json({
      success: false,
      message: `An error has occurred: ${err.message}`,
    });
  }
  
  
};
const deleteProduct = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.findByIdAndDelete(id)
    .then((deletedProduct) => {
      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    })
    .catch((err) => {
      res.status(500).json({
        success: false,
        message: "Failed to delete Product",
        error: err.message,
      });
    });
};



module.exports = {
  CreateProduct,
  GetAllproduct,
  GetSingleproduct,
  updateproduct,
  TrendingProduct,
  featuredProduct,
  RemovefromTrending,
  RemovefromFeatured,
  deleteProduct
}