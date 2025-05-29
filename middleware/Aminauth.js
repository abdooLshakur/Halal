const admin = require("../models/AdminModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const Protected = async (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    try {
      const Admin = await admin.findById(decoded.id);
      if (!Admin) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }

      req.Admin = Admin;
      next();
    } catch (err) {
      console.error(err); // optional
      res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
  });
};

module.exports = Protected;
