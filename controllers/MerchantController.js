const bcrypt = require('bcryptjs');
const Merchant = require("../models/MerchantModel")
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;


const CreateMerchant = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      banner,
      store_name,
      store_descp,
      social_meadia, 
    } = req.body;

    const check_user = await Merchant.findOne({ email });
    if (check_user) {
      return res.status(400).json({
        success: false,
        message: "Email Already Exists",
      });
    }

    const avatarPath = req.file ? req.file.path : null;

    const encrypt_password = await bcrypt.hash(password, 12);

    const New_member = {
      first_name,
      last_name,
      email,
      phone,
      banner,
      store_name,
      store_descp,
      social_meadia,
      avatar: avatarPath,
      password: encrypt_password,
    };

    const New_merchant = await new Merchant(New_member).save();

    res.status(201).json({
      success: true,
      message: "Merchant created successfully",
      data: {
        Name: `${New_merchant.first_name} ${New_merchant.last_name}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to create Merchant",
      error: err.message,
    });
  }
};


const loginMerchant = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find merchant by email
    const merchant = await Merchant.findOne({ email });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Email / Merchant not found",
      });
    }

    // Check if merchant is verified
    if (!merchant.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Merchant not verified",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate token
    const token = jwt.sign({ id: merchant._id, isAuthenticated: Merchant.isAuthenticated === "true" }, process.env.SECRET_KEY, {
      expiresIn: '10m',
    });

    // Update merchant's isAuthenticated field
    await Merchant.findByIdAndUpdate(merchant._id, { isAuthenticated: true });

    // Respond with merchant data and token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: merchant._id,
        first_name: merchant.first_name,
        last_name: merchant.last_name,
        email: merchant.email,
        phone: merchant.phone,
        store_name: merchant.store_name,
        token,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "An error occurred during login",
      error: err.message,
    });
  }
};

const getAllMerchants = async (req, res) => {
  try {
    const resp = await Merchant.find({}, {password: 0, is_active: 0, __v: 0})
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Merchant or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "All Merchants",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch Merchants",
      error: err.massage,
    });
  }
};

const getsingleMerchant = async (req, res) => {

  try {
    const id = req.params.Merchant_id
    const resp = await Merchant.findOne(id, {}, {password: 0, __v: 0})
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Merchant or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "Merchant",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch Merchant",
      error: err.massage,
    });
  }
};

const updateMerchant = async (req, res) => {
  try {
    const id = req.params.id;
    const avatarPath = req.file ? req.file.path : null;
    const bannerPath = req.file ? req.file.path : null;

    const resp = await Merchant.findByIdAndUpdate(
      id,
      {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        phone: req.body.phone,
        banner: req.body.banner,
        store_name: req.body.store_name,
        store_descp: req.body.store_descp,
        avatar: avatarPath,
        banner: bannerPath
      },
      { new: true }
    )

    if (!id) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Merchant or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "Merchant Updated Successfully",
      data: resp
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Update Merchant",
      error: err.massage,
    });
  }



};

const verifyUser = async (req, res) => {
  try {
    const id = req.body.id;
    const check_user = await Merchant.findById(id);
   
    if (check_user.is_verified !== "true") {
      res.json({ success: false, message: "User not authorized" });
      return;
    }
    await Merchant.findByIdAndUpdate({ is_active: true });
    res.json({ success: true, message: "User Verified Successfully" });
  } catch (err) {
    res.json({
      success: false,
      message: `An error has occured:${err.message}`,
    });
  }
};

const deleteMerchant = async (res, req) => {
  const id = req.params.id;
  if (!id) {
    return res.status(404).json({ error: 'User not found' });
  };
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Merchant or Admin not logged in",
    });
  }

  const resp = await Merchant.findByIdAndDelete(id)
  try{
      res.json({
        success: true,
        message: "Merchant Deleted Successfully",
        data: resp
      });
    }
    catch{
      res.json({
        success: false,
        message: "Failed to Delete Merchant",
        error: err.massage,
      });
    }
};

module.exports = {
  CreateMerchant,
  loginMerchant,
  getAllMerchants,
  updateMerchant,
  getsingleMerchant,
  verifyUser,
  deleteMerchant
};