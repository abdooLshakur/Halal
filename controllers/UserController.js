const bcrypt = require("bcryptjs");
const Users = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Create a new user
const CreateUser = async (req, res) => {
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

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    const avatar = req.file ? req.file.path : null;
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new Users({
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

    const savedUser = await newUser.save();

    res.json({
      success: true,
      message: "User registered successfully",
      data: savedUser,
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Sign up failed",
      error: err.message,
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, isAuthenticated: user.isAuthenticated === "true" },
      process.env.SECRET_KEY,
      { expiresIn: '7d' }
    );



    // Set user cookie with basic user info
    const safeUser = {
      id: user._id,
      name: user.first_name + " " + user.last_name,
      email: user.email,
      avatar: user.avatar,
    };

    // Set token cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      domain: ".zmhcollections.online",  // ✅ Add this
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set user cookie
    res.cookie("user", JSON.stringify(safeUser), {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      domain: ".zmhcollections.online",  // ✅ Add this
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.json({
      success: true,
      message: "Login successful",
      data: safeUser,
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

// Get all users (excluding password & version field)
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 9, location, ethnicity, age, gender, maritalStatus, height, weight, } = req.query;

  const filters = {};
  if (location) filters.location = location;
  if (ethnicity) filters.ethnicity = ethnicity;
  if (gender) filters.gender = gender;
  if (maritalStatus) filters.maritalStatus = maritalStatus;
  if (height) filters.height = { $lte: Number(height) };
  if (weight) filters.weight = { $lte: Number(weight) };

  try {
    const totalUsers = await Users.countDocuments(filters);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await Users.find(filters)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-password -__v");

    res.json({
      success: true,
      data: users,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users", error: err.message });
  }
};

// Get single user by ID
const getsingleUser = (req, res) => {
  const id = req.params.id;

  Users.findById(id, { password: 0, __v: 0 })
    .then((user) => {
      if (!user) {
        return res.json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        message: "User found",
        data: user,
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to fetch user",
        error: err.message,
      });
    });
};

// Update user info
const updateUser = async (req, res) => {
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

    // Update user
    const updatedUser = await Users.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Build cookie content using updatedUser data
    const userCookieData = {
      id: updatedUser._id,
      name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      avatar: updatedUser.avatar,
    };

    // Set cookie
    res.cookie("user", JSON.stringify(userCookieData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "User profile updated successfully",
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
};

// Request Reset Controller
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `https://halalmatch.vercel.app/reset-password?token=${token}&email=${email}`;

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Halal Matchmaking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset",
      html: `
        <p>Hi ${user.first_name},</p>
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

    // Find the user by decoded ID and email
    const user = await Users.findOne({ _id: decoded.id, email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Remove the reset token and expiration date
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the updated user
    await user.save();

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
        user: process.env.EMAIL_USER, // Your app email
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    // Mail content
    const mailOptions = {
      from: `"${name}" <${email}>`,         // User-sent
      to: process.env.EMAIL_USER,           // Your receiving inbox
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


// Logout user — clear cookies
const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.clearCookie("userAvatar");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

// Delete user by ID
const deleteUser = (req, res) => {
  const id = req.params.id;

  Users.findByIdAndDelete(id)
    .then(() => {
      res.json({
        success: true,
        message: "User deleted successfully",
      });
    })
    .catch((err) => {
      res.json({
        success: false,
        message: "Failed to delete user",
        error: err.message,
      });
    });
};

module.exports = {
  CreateUser,
  loginUser,
  getAllUsers,
  getsingleUser,
  resetPassword,
  requestPasswordReset,
  updateUser,
  contactUs,
  acknowledgeConsent,
  deleteUser,
  logoutUser,
};
