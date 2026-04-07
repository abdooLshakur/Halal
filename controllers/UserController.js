const bcrypt = require("bcryptjs");
const Users = require("../models/UserModel");
const ContactMessage = require("../models/ContactMessage");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { uploadBuffer } = require("../utils/Cloudinary");
const {
  buildCookieOptions,
  frontendBaseUrl,
  resetPasswordTokenTtl,
  resetPasswordTokenTtlMs,
} = require("../utils/config");
const { resolveMailerUser, sendEmail } = require("../utils/mailer");

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
    const avatarUpload = req.file
      ? await uploadBuffer(req.file, {
          folder: "halal_uploads/users",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        })
      : null;
    const avatar = avatarUpload?.secure_url || null;

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
      return res.json({ success: false, message: "account does not exist or invalid credentials" });
    }
    if (user.is_deleted === true) {
      return res.json({ success: false, message: "account has been deleted contact admin if this is an error" });
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

    // Set user cookie with basic user info
    const safeUser = {
      id: user._id,
      name: user.first_name + " " + user.last_name,
      email: user.email,
      avatar: user.avatar,
    };

    const cookieOptionsToken = buildCookieOptions({
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    const cookieOptionsUser = buildCookieOptions({
      httpOnly: false,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

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
  res.cookie(
    "cookie_consent",
    "accepted",
    buildCookieOptions({
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    })
  );

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

  const userId = req.user?._id;

  const filters = {
    is_deleted: { $ne: true },
    _id: { $ne: userId },  
  };

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

const AdminAllUsers = async (req, res) => {
  try {
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
    if (height && !isNaN(height)) filters.height = { $lte: Number(height) };
    if (weight && !isNaN(weight)) filters.weight = { $lte: Number(weight) };
    if (age && !isNaN(age)) filters.age = { $lte: Number(age) }; 

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

const getAvatar = async (req, res) => {
  const viewerId = req.user._id;
  const { userIds } = req.body; // Expecting array of userIds

  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds must be an array' });
  }

  try {
    // Fetch users who have approved the viewer
    const approvedUsers = await Users.find({
      _id: { $in: userIds },
      approvedViewers: { $in: [viewerId] }
    }).select('_id avatar');

    const avatarMap = approvedUsers.reduce((acc, user) => {
      acc[user._id] = user.avatar || null;
      return acc;
    }, {});

    return res.status(200).json({ avatars: avatarMap });
  } catch (error) {
    console.error('Error fetching avatars:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const avatarUpload = req.file
      ? await uploadBuffer(req.file, {
          folder: "halal_uploads/users",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        })
      : null;
    const avatarpath = avatarUpload?.secure_url;
    const nickname = req.body.nickname?.trim();

    if (nickname) {
      const existing = await Users.findOne({ nickname, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Nickname already in use by another user" });
      }
    }

    const updatedFields = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      age: req.body.age,
      gender: req.body.gender,
      numberOfKids: req.body.numberOfKids,
      location: req.body.location,
      maritalStatus: req.body.maritalStatus,
      hobbies: req.body.hobbies,
      bio: req.body.bio,
      bloodGroup: req.body.bloodGroup,
      complexion: req.body.complexion,
      dealBreakers: req.body.dealBreakers,
      ethnicity: req.body.ethnicity,
      genotype: req.body.genotype,
      height: req.body.height,
      numberOfWives: req.body.numberOfWives,
      physicalChallenges: req.body.physicalChallenges,
      pledgeAccepted: req.body.pledgeAccepted,
      profession: req.body.profession,
      qualification: req.body.qualification,
      religiousLevel: req.body.religiousLevel,
      spouseQualities: req.body.spouseQualities,
      stateOfOrigin: req.body.stateOfOrigin,
      weight: req.body.weight,
      nickname: req.body.nickname?.trim(),
    };


    if (avatarpath) {
      updatedFields.avatar = avatarpath;
    }

    const updatedUser = await Users.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }


    const userCookieData = {
      id: updatedUser._id,
      name: `${updatedUser.first_name} ${updatedUser.last_name}`,
      avatar: updatedUser.avatar,
    };

    res.cookie(
      "user",
      JSON.stringify(userCookieData),
      buildCookieOptions({
        httpOnly: false,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        includeDomain: false,
      })
    );

    return res.json({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser,
    });

  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: err.message,
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const email = req.body?.email || req.user?.email;

    if (!email) {
      return res.status(400).json({ error: "Email is required in request body" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      activated: user.isVerified,
    });

  } catch (err) {
    console.error("verifyUser error:", err);
    return res.status(500).json({ error: "Internal server error" });
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

    res.cookie(
      "user",
      JSON.stringify(userCookieData),
      buildCookieOptions({
        httpOnly: false,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        includeDomain: false,
      })
    );

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
    const normalizedEmail = req.body?.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Users.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: resetPasswordTokenTtl }
    );

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + resetPasswordTokenTtlMs;
    await user.save();

    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Password Reset",
      html: `
        <p>Hi ${user.first_name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
      text: `Hi ${user.first_name}, reset your password using this link: ${resetLink}`,
    });

    res.status(200).json({
      message: "Reset link sent to your email",
      token,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({
      message: "Failed to send reset email",
      error: error.response?.data?.message || error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const normalizedEmail = req.body?.email?.trim().toLowerCase();

    // CorrecFerence to the environment variable
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Will throw if invalid/expired

    // Find the user by decoded ID and email
    const user = await Users.findOne({ _id: decoded.id, email: normalizedEmail });
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
    const { name, email, subject = "", message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const savedMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    const mailerUser = resolveMailerUser();

    await sendEmail({
      to: mailerUser,
      subject: subject.trim() || "New Message",
      html: `
        <h2>Contact Form Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "N/A"}\n\n${message}`,
      from: `"${name}" <${email}>`,
      replyTo: email,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
      data: savedMessage,
    });
  } catch (error) {
    console.error("Error in contactUs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages." });
  }
};


const logoutUser = (req, res) => {
  res.clearCookie(
    "token",
    buildCookieOptions({
      httpOnly: true,
    })
  );

  res.clearCookie(
    "user",
    buildCookieOptions({
      httpOnly: false,
    })
  );

  return res.status(200).json({ message: "Logged out successfully" });
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Users.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Toggle logic here
    user.is_deleted = !user.is_deleted;
    await user.save();

    res.status(200).json({ success: true, data:"user recycled" });
  } catch (error) {
    console.error('Error toggling user deletion status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  CreateUser,
  loginUser,
  getAllUsers,
  getsingleUser,
  resetPassword,
  getAvatar,
  requestPasswordReset,
  updateUser,
  contactUs,
  verifyUser,
  activateUserAfterPayment,
  acknowledgeConsent,
  manualactvateuser,
  deleteUser,
  logoutUser,
  AdminAllUsers,
  getContactMessages,
};
