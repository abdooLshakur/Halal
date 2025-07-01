const bcrypt = require("bcryptjs");
const Users = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const axios = require("axios");

const CreateUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      age,
      gender,
      maritalStatus,
      phone,
      pledgeAccepted,
      marriageIntentDuration,
    } = req.body;

    // ✅ Validate required fields
    if (
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !age ||
      !gender ||
      !maritalStatus ||
      !phone ||
      pledgeAccepted === undefined ||
      !marriageIntentDuration
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await Users.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const avatar = req.file ? req.file.path : null;

    const newUser = new Users({
      first_name,
      last_name,
      email: normalizedEmail,
      password: hashedPassword,
      age,
      phone,
      gender,
      maritalStatus,
      marriageIntentDuration,
      pledgeAccepted,
      avatar,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: savedUser,
    });

  } catch (err) {
    // Better error clarity
    if (err.code === 11000 && err.keyValue?.email) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Log for dev only
    console.error("Signup error:", err);

    res.status(500).json({
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
      { expiresIn: '2d' }
    );



    // // Set user cookie with basic user info
    // const safeUser = {
    //   id: user._id,
    //   name: user.first_name + " " + user.last_name,
    //   email: user.email,
    //   avatar: user.avatar,
    // };

    // // Set token cookie
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    //   domain: ".halalmatchmakings.com",  // ✅ Add this
    //   maxAge: 2 * 24 * 60 * 60 * 1000,
    // });

    // // Set user cookie
    // res.cookie("user", JSON.stringify(safeUser), {
    //   httpOnly: false,
    //   secure: true,
    //   sameSite: "None",
    //   domain: ".halalmatchmakings.com",  // ✅ Add this
    //   maxAge: 2 * 24 * 60 * 60 * 1000,
    // });

    // Set user cookie with basic user info
    const safeUser = {
      id: user._id,
      name: user.first_name + " " + user.last_name,
      email: user.email,
      avatar: user.avatar,
    };

    const isProduction = process.env.NODE_ENV === "production";

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

    // Set cookies
    res.cookie("token", token, cookieOptionsToken);
    res.cookie("user", JSON.stringify(safeUser), cookieOptionsUser);


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
  const {
    location,
    ethnicity,
    age,
    gender,
    maritalStatus,
    height,
    weight,
  } = req.query;

  const filters = {};

  if (location) filters.location = location;
  if (ethnicity) filters.ethnicity = ethnicity;
  if (gender) filters.gender = gender;
  if (maritalStatus) filters.maritalStatus = maritalStatus;
  if (height) filters.height = { $lte: Number(height) };
  if (weight) filters.weight = { $lte: Number(weight) };
  if (age) filters.age = { $lte: Number(age) };

  try {
    const users = await Users.find(filters).select("-password -__v");

    res.json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
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

    const updatedFields = {
      numberOfKids: req.body.numberOfKids,
      numberOfWives: req.body.numberOfWives,
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
      preferredSpouseTraits: req.body.preferredSpouseTraits,
      dealBreakers: req.body.dealBreakers,
      physicalChallenges: req.body.physicalChallenges,
      marriageIntentDuration: req.body.marriageIntentDuration,
      pledgeAccepted: req.body.pledgeAccepted,
      phone: req.body.phone,
      bio: req.body.bio,
    };

    if (avatarpath) {
      updatedFields.avatar = avatarpath;
    }

    const updatedUser = await Users.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userCookieData = {
      id: updatedUser._id,
      name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      avatar: updatedUser.avatar,
    };

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

const verifyUser = async (req, res) => {
  try {
    let parsedUser;

    // Try from cookie
    if (req.cookies?.user) {
      try {
        parsedUser = JSON.parse(req.cookies.user);
      } catch (err) {
        console.warn("Malformed user cookie");
      }
    }

    // Try from request body if cookie missing or invalid
    if (!parsedUser && req.body?.user) {
      parsedUser = req.body.user;
    }

    if (!parsedUser?.email) {
      return res.status(400).json({ error: "No valid user data found" });
    }

    const user = await Users.findOne({ email: parsedUser.email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      activated: user.isVerified,
      email: user.email,
    });

  } catch (err) {
    console.error("verifyUser error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const manualactvateuser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ message: 'isVerified must be a boolean' });
    }

    const user = await Users.findByIdAndUpdate(
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
const activateUserAfterPayment = async (req, res) => {
  try {
    const { email, reference } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ success: false, message: "Missing email or payment reference" });
    }

    // Verify payment with Paystack
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Make sure it's set in your .env
      },
    });

    const paymentData = paystackRes.data;

    if (!paymentData.status || paymentData.data.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    // Optional: You can check payment amount, currency, and email for extra validation
    if (paymentData.data.customer.email !== email) {
      return res.status(403).json({ success: false, message: "Email mismatch in transaction" });
    }

    // Activate user
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isVerified = true;
    await user.save();

    // Update cookie
    const userCookieData = {
      id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      avatar: user.avatar,
      activated: true,
    };

    res.cookie("user", JSON.stringify(userCookieData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User activated after verified payment",
    });
  } catch (err) {
    console.error("Paystack verification error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: "Internal server error during verification",
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

    const resetLink = `https://www.halalmatchmakings.com/reset-password?token=${token}&email=${email}`;
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

    // CorrecFerence to the environment variable
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Will throw if invalid/expired

    // Find the user by decoded ID and email
    const user = await Users.findOne({ _id: decoded.id, email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: "Reset token expired" });
    }

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
  verifyUser,
  activateUserAfterPayment,
  acknowledgeConsent,
  manualactvateuser,
  deleteUser,
  logoutUser,
};
