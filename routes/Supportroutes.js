const express = require("express");
const router = express.Router();
const authenticateToken = require('../middleware/Auth');
const {
    Contactus
  
} = require("../controllers/Support");

router.post("/express-interest/:id", authenticateToken, Contactus);

module.exports = router;
