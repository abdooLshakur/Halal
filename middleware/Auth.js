const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error(err); // optional
      res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
  });
};

module.exports = authenticateToken;
