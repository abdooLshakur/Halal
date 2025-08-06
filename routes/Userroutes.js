const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');
const Protected = require('../middleware/Aminauth');

const {CreateUser, loginUser, getsingleUser, getAllUsers, getAvatar, updateUser, deleteUser, requestPasswordReset, AdminAllUsers,resetPassword, contactUs, verifyUser, activateUserAfterPayment, manualactvateuser, logoutUser} = require("../controllers/UserController");

router.post("/register-User", upload.single('avatar'), CreateUser);
router.post("/user-login", loginUser);
router.post("/activate", activateUserAfterPayment);
router.post("/request-password-reset", requestPasswordReset);
router.post('/checkactivation', authenticateToken, verifyUser);
router.post("/reset-password", resetPassword);
router.post("/contactus", contactUs);
router.post("/logout", logoutUser);
router.post('/users/avatars', authenticateToken, getAvatar); // 🔐 Protected
router.put('/update-user/:id', authenticateToken, upload.single('avatar'), updateUser);
router.put('/delete-user/:id', Protected, deleteUser);
router.get('/users',  getAllUsers);
router.get('/Admin-users', AdminAllUsers);
router.get('/user/:id',  authenticateToken,getsingleUser);
router.get('/activate-user/:userId', Protected, manualactvateuser);

module.exports = router;