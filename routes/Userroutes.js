const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateUser, loginUser, getsingleUser, getAllUsers, updateUser, deleteUser, requestPasswordReset, resetPassword, contactUs, verifyUser, activateUserAfterPayment, manualactvateuser, logoutUser} = require("../controllers/UserController");

router.post("/register-User", upload.single('avatar'), CreateUser);
router.post("/user-login", loginUser);
router.post("/activate", activateUserAfterPayment);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/contactus", contactUs);
router.put('/update-user/:id', authenticateToken, upload.single('avatar'), updateUser);
router.get('/users', getAllUsers);
router.get('/checkactivation', authenticateToken, verifyUser);
router.get('/user/:id',  authenticateToken,getsingleUser);
router.get('/activate-user/:userId', authenticateToken, manualactvateuser);
router.delete('/delete-user/:id',  authenticateToken,deleteUser);

module.exports = router;