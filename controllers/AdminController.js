const bcrypt = require("bcryptjs");
const Admins = require("../models/AdminModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Create a new Admin
const CreateAdmin = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone = "",
      password,
      age,
      gender,
      location = "",
      stateOfOrigin = "",
    } = req.body;

    console.log("📥 Incoming signup request:", req.body);

    // === Required Field Check ===
    if (!first_name || !last_name || !email || !password || !gender || !age) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: first name, last name, email, password, gender, age",
      });
    }

    // === Age Validation ===
    const isValidAge = /^\d+$/.test(age) && parseInt(age) >= 18;
    if (!isValidAge) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register",
      });
    }

    // === Email Uniqueness Check ===
    const existingAdmin = await Admins.findOne({ email: email.trim().toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // === Optional File Upload (avatar) ===
    const avatar = req.file ? req.file.path : '';

    // === Hash the Password ===
    const hashedPassword = await bcrypt.hash(password, 12);

    // === Create New Admin ===
    const newAdmin = new Admins({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      age: age.trim(), // or use parseInt(age) if model is changed
      gender: gender.trim(),
      location: location.trim(),
      stateOfOrigin: stateOfOrigin.trim(),
      avatar,
    });

    const savedAdmin = await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: savedAdmin,
    });
  } catch (err) {
    console.error("❌ Sign-up error:", {
      message: err.message,
      stack: err.stack,
      body: req.body,
    });

    res.status(500).json({
      success: false,
      message: "Sign up failed. Please try again later.",
      error: err.message,
    });
  }
};

// Login Admin
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const Admin = await Admins.findOne({ email });

    if (!Admin) {
      return res.json({ success: false, message: "Admin not found" });
    }
    if (Admin.isVerified === false) {
      return res.json({ success: false, message: "Admin not verified" });
    }

    const isMatch = await bcrypt.compare(password, Admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: Admin._id, isAuthenticated: Admin.isAuthenticated },
      process.env.SECRET_KEY,
      { expiresIn: '4h' }
    );

    const safeAdmin = {
      id: Admin._id,
      name: Admin.first_name + " " + Admin.last_name,
      email: Admin.email,
      avatar: Admin.avatar,
    };

   
    const cookieOptionsToken = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
      ...(isProduction && { domain: ".halalmatchmakings.com" }), // only add domain in production
    };

    const cookieOptionsUser = {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
      ...(isProduction && { domain: ".halalmatchmakings.com" }),
    };


    res.cookie("token", token, cookieOptionsToken);
    res.cookie("Admin", JSON.stringify(safeAdmin), cookieOptionsUser);

    res.json({
      success: true,
      message: "Login successful",
      data: safeAdmin,
    });

  } catch (err) {
    res.json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

const acknowledgeConsent = (req, res) => {
  res.cookie("cookie_consent", "accepted", {
    sameSite: "none",
    secure: true,
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    domain: process.env.COOKIE_DOMAIN || ".halalmatchmakings.com",
  });
  res.status(200).json({ success: true, message: "Consent acknowledged" });
};

const getAllAdmins = async (req, res) => {
  const { page = 1, limit = 9, location, age, gender } = req.query;
  const filters = {};
  if (location) filters.location = location;
  if (gender) filters.gender = gender;

  try {
    const totalAdmins = await Admins.countDocuments(filters);
    const totalPages = Math.ceil(totalAdmins / limit);
    const Admin = await Admins.find(filters)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password -__v");

    res.json({ success: true, data: Admin, totalPages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch Admins", error: err.message });
  }
};

const getsingleAdmin = (req, res) => {
  const id = req.params.id;
  Admins.findById(id, { password: 0, __v: 0 })
    .then((Admin) => {
      if (!Admin) {
        return res.json({ success: false, message: "Admin not found" });
      }
      res.json({ success: true, message: "Admin found", data: Admin });
    })
    .catch((err) => {
      res.json({ success: false, message: "Failed to fetch Admin", error: err.message });
    });
};

const updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const avatarpath = req.file ? req.file.path : undefined;

    const updatedFields = {
      age: req.body.age,
      gender: req.body.gender,
      location: req.body.location,
      stateOfOrigin: req.body.stateOfOrigin,
    };
    if (avatarpath) updatedFields.avatar = avatarpath;

    const updatedAdmin = await Admins.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const AdminCookieData = {
      id: updatedAdmin._id,
      name: `${updatedAdmin.first_name} ${updatedAdmin.last_name}`,
      avatar: updatedAdmin.avatar,
    };

    res.cookie("Admin", JSON.stringify(AdminCookieData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN || ".halalmatchmakings.com",
    });

    res.json({ success: true, message: "Admin profile updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Failed to update Admin", error: err.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const Admin = await Admins.findOne({ email });
    if (!Admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const token = jwt.sign({ id: Admin._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

    Admin.resetPasswordToken = token;
    Admin.resetPasswordExpires = Date.now() + 3600000;
    await Admin.save();

    const resetLink = `https://www.halalmatchmakings.com/reset-password?token=${token}&email=${email}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_Admin,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Halal Matchmaking" <${process.env.EMAIL_Admin}>`,
      to: email,
      subject: "Password Reset",
      html: `
        <p>Hi ${Admin.first_name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email", token, email });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const Admin = await Admins.findOne({ _id: decoded.id, email });
    if (!Admin) return res.status(404).json({ message: "Admin not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    Admin.password = hashedPassword;
    Admin.resetPasswordToken = undefined;
    Admin.resetPasswordExpires = undefined;
    await Admin.save();

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired" });
    }
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

const verifyAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ message: 'isVerified must be a boolean' });
    }

    const user = await Admins.findByIdAndUpdate(
      userId,
      { isVerified },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${isVerified ? 'activated' : 'disabled'} successfully`, user });
  } catch (err) {
    console.error("Server error verifying user:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutAdmin = (req, res) => {
  res.clearCookie("token", { domain: process.env.COOKIE_DOMAIN || ".halalmatchmakings.com" });
  res.clearCookie("Admin", { domain: process.env.COOKIE_DOMAIN || ".halalmatchmakings.com" });
  res.json({ success: true, message: "Logged out successfully" });
};

const deleteAdmin = (req, res) => {
  const id = req.params.id;
  Admins.findByIdAndDelete(id)
    .then(() => {
      res.json({ success: true, message: "Admin deleted successfully" });
    })
    .catch((err) => {
      res.json({ success: false, message: "Failed to delete Admin", error: err.message });
    });
};

module.exports = {
  CreateAdmin,
  loginAdmin,
  getAllAdmins,
  getsingleAdmin,
  resetPassword,
  requestPasswordReset,
  updateAdmin,
  verifyAdmin,
  acknowledgeConsent,
  deleteAdmin,
  logoutAdmin,
};
