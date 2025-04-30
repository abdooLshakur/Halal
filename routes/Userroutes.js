const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateUser, loginUser, getsingleUser, getAllUsers, updateUser, deleteUser, requestPasswordReset, resetPassword, acknowledgeConsent} = require("../controllers/UserController")

router.post("/register-User", upload.single('avatar'), CreateUser);
router.post("/user-login", loginUser);
router.post("/consent", acknowledgeConsent);
router.put('/update-user/:id', authenticateToken, upload.single('avatar'), updateUser);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get('/users', getAllUsers);
router.get('/user/:id',  getsingleUser);
router.get("/test-cookies", (req, res) => {
    console.log("Cookies received:", req.cookies);
  
    res.json({
      success: true,
      message: "Cookies received on server",
      cookies: req.cookies,
    });
  });
  
router.delete('/delete-user', authenticateToken, deleteUser);

module.exports = router;