const bcrypt = require("bcryptjs");
const Admins = require("../models/AdminModel");
const Users = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { uploadBuffer } = require("../utils/Cloudinary");
const {
  buildCookieOptions,
  frontendBaseUrl,
  resetPasswordTokenTtl,
  resetPasswordTokenTtlMs,
} = require("../utils/config");
const { sendEmail } = require("../utils/mailer");
const { ensureResendConfigured, sendBatchEmails } = require("../utils/resend");

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

    if (!first_name || !last_name || !email || !password || !gender || !age) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: first name, last name, email, password, gender, age",
      });
    }

    const isValidAge = /^\d+$/.test(age) && parseInt(age) >= 18;
    if (!isValidAge) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register",
      });
    }

    const existingAdmin = await Admins.findOne({ email: email.trim().toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const avatarUpload = req.file
      ? await uploadBuffer(req.file, {
          folder: "halal_uploads/admins",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        })
      : null;
    const avatar = avatarUpload?.secure_url || '';

    const hashedPassword = await bcrypt.hash(password, 12);

    const newAdmin = new Admins({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      age: age.trim(),
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

    const cookieOptionsToken = buildCookieOptions({
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    const cookieOptionsUser = buildCookieOptions({
      httpOnly: false,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });


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
    const avatarUpload = req.file
      ? await uploadBuffer(req.file, {
          folder: "halal_uploads/admins",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        })
      : null;
    const avatarpath = avatarUpload?.secure_url;

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

    res.cookie(
      "Admin",
      JSON.stringify(AdminCookieData),
      buildCookieOptions({
        httpOnly: false,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
    );

    res.json({ success: true, message: "Admin profile updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Failed to update Admin", error: err.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const normalizedEmail = req.body?.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const Admin = await Admins.findOne({ email: normalizedEmail });
    if (!Admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const token = jwt.sign(
      { id: Admin._id },
      process.env.SECRET_KEY,
      { expiresIn: resetPasswordTokenTtl }
    );

    Admin.resetPasswordToken = token;
    Admin.resetPasswordExpires = Date.now() + resetPasswordTokenTtlMs;
    await Admin.save();

    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Password Reset",
      html: `
        <p>Hi ${Admin.first_name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
      text: `Hi ${Admin.first_name}, reset your password using this link: ${resetLink}`,
      userEnvKey: "EMAIL_Admin",
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
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const Admin = await Admins.findOne({ _id: decoded.id, email: normalizedEmail });
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

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildBroadcastHtml = ({ heading, message }) => {
  const safeHeading = escapeHtml(heading);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, "<br />");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #4a2136;">
      <div style="border-radius: 24px; padding: 32px; background: linear-gradient(180deg, #fff7fa 0%, #fff0f5 100%); border: 1px solid #f4c8d9;">
        <p style="margin: 0 0 12px; color: #b62f69; font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase;">
          Halal Matchmaking
        </p>
        <h1 style="margin: 0 0 18px; color: #6c2148; font-size: 28px; line-height: 1.2;">
          ${safeHeading}
        </h1>
        <div style="font-size: 16px; line-height: 1.75; color: #5d3043;">
          ${safeMessage}
        </div>
      </div>
    </div>
  `;
};

const sendBroadcastEmail = async (req, res) => {
  try {
    ensureResendConfigured();

    const {
      subject,
      message,
      audience = "verified",
      replyTo,
      dryRun = false,
      testEmail,
    } = req.body || {};

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required",
      });
    }

    if (!["verified", "all"].includes(audience)) {
      return res.status(400).json({
        success: false,
        message: "Audience must be either 'verified' or 'all'",
      });
    }

    const normalizedTestEmail = testEmail?.trim().toLowerCase();

    let recipients = [];

    if (normalizedTestEmail) {
      recipients = [normalizedTestEmail];
    } else {
      const query = {
        is_deleted: { $ne: true },
      };

      if (audience === "verified") {
        query.isVerified = true;
      }

      const users = await Users.find(query).select("email first_name").lean();
      recipients = [...new Set(
        users
          .map((user) => user.email?.trim().toLowerCase())
          .filter(Boolean)
      )];
    }

    if (recipients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No recipients found for the selected audience",
      });
    }

    const html = buildBroadcastHtml({
      heading: subject.trim(),
      message: message.trim(),
    });

    const text = message.trim();

    if (dryRun) {
      return res.status(200).json({
        success: true,
        dryRun: true,
        isTest: Boolean(normalizedTestEmail),
        testEmail: normalizedTestEmail || null,
        audience,
        recipientCount: recipients.length,
        sampleRecipients: recipients.slice(0, 10),
      });
    }

    const delivery = await sendBatchEmails({
      recipients,
      subject: subject.trim(),
      html,
      text,
      replyTo: replyTo?.trim() || undefined,
    });

    return res.status(200).json({
      success: true,
      message: normalizedTestEmail
        ? "Test email sent with Resend"
        : "Broadcast email queued with Resend",
      isTest: Boolean(normalizedTestEmail),
      testEmail: normalizedTestEmail || null,
      audience,
      recipientCount: recipients.length,
      batchCount: delivery.batchCount,
      batchSize: delivery.batchSize,
    });
  } catch (error) {
    console.error("Broadcast email error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send broadcast email",
      providerError: error.response?.data || null,
    });
  }
};

const logoutAdmin = (req, res) => {
  res.clearCookie(
    "token",
    buildCookieOptions({
      httpOnly: true,
    })
  );
  res.clearCookie(
    "Admin",
    buildCookieOptions({
      httpOnly: false,
    })
  );
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
  sendBroadcastEmail,
  acknowledgeConsent,
  deleteAdmin,
  logoutAdmin,
};
