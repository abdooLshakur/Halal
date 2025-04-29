const bcrypt = require('bcryptjs');
const Admin = require("../models/AdminModel")
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;


const CreateAdmin = async (req, res) => {
  try {
    const { first_name, last_name, email, password, store_name, phone, store_descp} = req.body;
   
    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

 const check_user = await Admin.findOne({ email });
    if (check_user) {
      return res.status(400).json({
        success: false,
        message: "Email Already Exists",
      });
    }
    // Validate password format
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Proceed with bcrypt hashing 
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      first_name,
      last_name,
      email,
      phone,
      store_name,
      store_descp,
      password: hashedPassword,
    });

    const savedAdmin = await newAdmin.save();
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: savedAdmin,
    });
  } catch (err) {
    console.error("Error in CreateAdmin:", err); 
    res.status(500).json({
      success: false,
      message: "Failed to create Admin",
      error: err.message,
    });
  }
};



const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find Admin by email
    const Admin = await Admin.findOne({ email });
    if (!Admin) {
      return res.status(404).json({
        success: false,
        message: "Email / Admin not found",
      });
    }

    // Check if Admin is verified
    if (!Admin.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Admin not verified",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, Admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate token
    const token = jwt.sign({ id: Admin._id, isAuthenticated: Admin.isAuthenticated === "true" }, process.env.SECRET_KEY, {
      expiresIn: '10m',
    });

    // Update Admin's isAuthenticated field
    await Admin.findByIdAndUpdate(Admin._id, { isAuthenticated: true });

    // Respond with Admin data and token
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: Admin._id,
        first_name: Admin.first_name,
        last_name: Admin.last_name,
        email: Admin.email,
        phone: Admin.phone,
        store_name: Admin.store_name,
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

const getAllAdmins = async (req, res) => {
  try {
    const resp = await Admin.find({}, {password: 0, is_active: 0, __v: 0})
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Admin or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "All Admins",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch Admins",
      error: err.massage,
    });
  }
};

const getsingleAdmin = async (req, res) => {

  try {
    const id = req.params.Admin_id
    const resp = await Admin.findOne(id, {}, {password: 0, __v: 0})
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Admin or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "Admin",
      data: resp,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Fetch Admin",
      error: err.massage,
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const avatarPath = req.file ? req.file.path : null;
    const bannerPath = req.file ? req.file.path : null;

    const resp = await Admin.findByIdAndUpdate(
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
      return res.status(404).json({ error: 'Admin not found' });
    }
    const isLoggedIn = req.user && req.user.isAuthenticated;

    if (!isLoggedIn) {
      return res.status(401).json({
        success: false,
        message: "Admin or Admin not logged in",
      });
    }
    res.json({
      success: true,
      message: "Admin Updated Successfully",
      data: resp
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Failed to Update Admin",
      error: err.massage,
    });
  }



};

const verifyUser = async (req, res) => {
  try {
    const id = req.body.id;
    const check_user = await Admin.findById(id);
   
    if (check_user.is_verified !== "true") {
      res.json({ success: false, message: "User not authorized" });
      return;
    }
    await Admin.findByIdAndUpdate({ is_active: true });
    res.json({ success: true, message: "User Verified Successfully" });
  } catch (err) {
    res.json({
      success: false,
      message: `An error has occured:${err.message}`,
    });
  }
};

const deleteAdmin = async (res, req) => {
  const id = req.params.id;
  if (!id) {
    return res.status(404).json({ error: 'User not found' });
  };
  const isLoggedIn = req.user && req.user.isAuthenticated;

  if (!isLoggedIn) {
    return res.status(401).json({
      success: false,
      message: "Admin or Admin not logged in",
    });
  }

  const resp = await Admin.findByIdAndDelete(id)
  try{
      res.json({
        success: true,
        message: "Admin Deleted Successfully",
        data: resp
      });
    }
    catch{
      res.json({
        success: false,
        message: "Failed to Delete Admin",
        error: err.massage,
      });
    }
};

module.exports = {
  CreateAdmin,
  loginAdmin,
  getAllAdmins,
  updateAdmin,
  getsingleAdmin,
  verifyUser,
  deleteAdmin
};