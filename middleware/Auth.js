const Merchant = require("../models/MerchantModel");
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }

      jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(403).json({ success: false, message: "Invalid or expired token" });
        }
    
        try {
          // Fetch merchant by ID decoded from token
          const merchant = await Merchant.findById(decoded.id);
          if (!merchant) {
            return res.status(404).json({ success: false, message: "Merchant not found" });
          }
    
          req.merchant = merchant; 
          next(); 
        } catch (err) {
          res.status(500).json({ success: false, message: "Server error", error: err.message });
        }
    });
      };
module.exports = authenticateToken;
