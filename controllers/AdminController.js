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
      password,
      age,
      gender,
      location,
      stateOfOrigin,
      ethnicity,
      maritalStatus,
      numberOfKids,
      height,
      weight,
      genotype,
      bloodGroup,
      complexion,
      qualification,
      profession,
      hobbies,
      religiousLevel,
      spouseQualities,
      dealBreakers,
      physicalChallenges,
      bio
    } = req.body;

    const existingAdmin = await Admins.findOne({ email });
    if (existingAdmin) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    const avatar = req.file ? req.file.path : null;
    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = new Admins({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      age,
      gender,
      location,
      stateOfOrigin,
      ethnicity,
      maritalStatus,
      avatar,
      numberOfKids,
      height,
      weight,
      genotype,
      bloodGroup,
      complexion,
      qualification,
      profession,
      hobbies,
      religiousLevel,
      spouseQualities,
      dealBreakers,
      physicalChallenges,
      bio,
    });

    const savedAdmin = await newAdmin.save();

    res.json({
      success: true,
      message: "Admin registered successfully",
      data: savedAdmin,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Sign up failed",
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
    if (Admin.isverified === false) {
      return res.json({ success: false, message: "Admin not verified" });
    }

    const isMatch = await bcrypt.compare(password, Admin.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: Admin._id, isAuthenticated: Admin.isAuthenticated === "true" },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    );



    // Set Admin cookie with basic Admin info
    const safeAdmin = {
      id: Admin._id,
      name: Admin.first_name + " " + Admin.last_name,
      email: Admin.email,
      avatar: Admin.avatar,
    };

    // Set token cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".halalmatchmakings.com",  
      maxAge: 4 * 60 * 60 * 1000, 
    });

    // Set Admin cookie
    res.cookie("Admin", JSON.stringify(safeAdmin), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".halalmatchmakings.com",  
      maxAge: 4 * 60 * 60 * 1000, 
    });


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
  });

  res.status(200).json({ success: true, message: "Consent acknowledged" });
};

// Get all Admins (excluding password & version field)
const getAllAdmins = async (req, res) => {
  const { page = 1, limit = 9, location, ethnicity, age, gender, maritalStatus, height, weight, } = req.query;

  const filters = {};
  if (location) filters.location = location;
  if (ethnicity) filters.ethnicity = ethnicity;
  if (gender) filters.gender = gender;
  if (maritalStatus) filters.maritalStatus = maritalStatus;
  if (height) filters.height = { $lte: Number(height) };
  if (weight) filters.weight = { $lte: Number(weight) };

  try {
    const totalAdmins = await Admins.countDocuments(filters);
    const totalPages = Math.ceil(totalAdmins / limit);

    const Admins = await Admins.find(filters)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password -__v");

    res.json({
      success: true,
      data: Admins,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch Admins", error: err.message });
  }
};

// Get single Admin by ID
const getsingleAdmin = (req, res) => {
  const id = req.params.id;

  Admins.findById(id, { password: 0, __v: 0 })
    .then((Admin) => {
      if (!Admin) {
        return res.json({ success: false, message: "Admin not found" });
      }
      res.json({
        success: true,
        message: "Admin found",
        data: Admin,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to fetch Admin",
        error: err.message,
      });
    });
};

// Update Admin info
const updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const avatarpath = req.file ? req.file.path : undefined;

    // Build updated fields manually
    const updatedFields = {
      numberOfKids: req.body.numberOfKids,
      location: req.body.location,
      stateOfOrigin: req.body.stateOfOrigin,
      ethnicity: req.body.ethnicity,
      height: req.body.height,
      weight: req.body.weight,
      genotype: req.body.genotype,
      bloodGroup: req.body.bloodGroup,
      complexion: req.body.complexion,
      qualification: req.body.qualification,
      profession: req.body.profession,
      hobbies: req.body.hobbies,
      religiousLevel: req.body.religiousLevel,
      spouseQualities: req.body.spouseQualities,
      dealBreakers: req.body.dealBreakers,
      physicalChallenges: req.body.physicalChallenges,
      bio: req.body.bio,
      avatar: avatarpath,
    };

    if (avatarpath) {
      updatedFields.avatar = avatarpath;
    }

    // Update Admin
    const updatedAdmin = await Admins.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Build cookie content using updatedAdmin data
    const AdminCookieData = {
      id: updatedAdmin._id,
      name: `${updatedAdmin.first_name} ${updatedAdmin.last_name}`,
      avatar: updatedAdmin.avatar,
    };

    // Set cookie
    res.cookie("Admin", JSON.stringify(AdminCookieData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Admin profile updated successfully",
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update Admin",
      error: err.message,
    });
  }
};

// Request Reset Controller
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const Admin = await Admins.findOne({ email });
    if (!Admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const token = jwt.sign(
      { id: Admin._id },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    Admin.resetPasswordToken = token;
    Admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await Admin.save();

    const resetLink = `https://halalmatch.vercel.app/reset-password?token=${token}&email=${email}`;

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        Admin: process.env.EMAIL_Admin,
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

    res.status(200).json({
      message: "Reset link sent to your email",
      token,
      email,
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password Controller
const resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Correct the reference to the environment variable
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Will throw if invalid/expired

    // Find the Admin by decoded ID and email
    const Admin = await Admins.findOne({ _id: decoded.id, email });
    if (!Admin) return res.status(404).json({ message: "Admin not found" });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    Admin.password = hashedPassword;

    // Remove the reset token and expiration date
    Admin.resetPasswordToken = undefined;
    Admin.resetPasswordExpires = undefined;

    // Save the updated Admin
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

const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        Admin: process.env.EMAIL_Admin, // Your app email
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    // Mail content
    const mailOptions = {
      from: `"${name}" <${email}>`,         // Admin-sent
      to: process.env.EMAIL_Admin,           // Your receiving inbox
      subject: "New Message",
      html: `
        <h2>Contact Form Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    // Send the mail
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Message sent successfully." });
  } catch (error) {
    console.error("Error in contactUs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// Logout Admin — clear cookies
const logoutAdmin = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("AdminAvatar");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Delete Admin by ID
const deleteAdmin = (req, res) => {
  const id = req.params.id;

  Admins.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "Admin deleted successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to delete Admin",
        error: err.message,
      });
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
  contactUs,
  acknowledgeConsent,
  deleteAdmin,
  logoutAdmin,
};
