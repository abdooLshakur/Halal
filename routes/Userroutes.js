const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateUser, loginUser, getsingleUser, getAllUsers, getAvatar, updateUser, deleteUser, requestPasswordReset, resetPassword, contactUs, verifyUser, activateUserAfterPayment, manualactvateuser, logoutUser} = require("../controllers/UserController");
const { serveAvatar } = require("../controllers/ServeAvatar");

router.post("/register-User", upload.single('avatar'), CreateUser);
router.post("/user-login", loginUser);
router.post("/activate", activateUserAfterPayment);
router.post("/request-password-reset", requestPasswordReset);
router.post('/checkactivation', authenticateToken, verifyUser);
router.post("/reset-password", resetPassword);
router.post("/contactus", contactUs);
router.post("/logout", logoutUser);
router.put('/update-user/:id', authenticateToken, upload.single('avatar'), updateUser);
router.get('/users', getAllUsers);
router.post('/users/avatars', authenticateToken, getAvatar); // 🔐 Protected
router.get('/user/:id',  authenticateToken,getsingleUser);
router.get('/activate-user/:userId', authenticateToken, manualactvateuser);
router.delete('/delete-user/:id',  authenticateToken,deleteUser);

module.exports = router;