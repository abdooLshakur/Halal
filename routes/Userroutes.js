const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads")
const authenticateToken = require('../middleware/Auth');

const {CreateUser, loginUser, getsingleUser, getAllUsers, updateUser, deleteUser} = require("../controllers/UserController")

router.post("/api/register-user", authenticateToken, upload.single('avatar'), CreateUser);
router.post("/api/user-login", loginUser);
router.put('/api/update-user/:id', authenticateToken, upload.single('avatar'), updateUser);
router.get('/api/users', authenticateToken, getAllUsers);
router.get('/api/user', authenticateToken, getsingleUser);
router.delete('/api/delete-user', authenticateToken, deleteUser);

module.exports = router;