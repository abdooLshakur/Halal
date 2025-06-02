const express = require("express");
const router = express.Router();
const upload = require("../middleware/Fileuploads");
const Protected = require('../middleware/Aminauth');

const { 
    CreateAdmin, 
    loginAdmin, 
    updateAdmin, 
    getAllAdmins,
    getsingleAdmin,
    deleteAdmin,
    verifyAdmin,
} = require("../controllers/AdminController");
const { verifyUser } = require("../controllers/UserController");


router.post("/register-Admin", upload.single('avatar'), CreateAdmin);
router.post("/Admin-login", loginAdmin);
router.put('/users/:userId/verify', Protected, verifyUser);
router.put('/admins/:userId/verify', Protected, verifyAdmin);
router.put('/update-Admin/:id',     Protected, upload.single('avatar'), updateAdmin);
router.get('/all-Admins', Protected, getAllAdmins);
router.get('/Admin',  Protected, getsingleAdmin);
router.delete('/delete-Admin/:id',  Protected, deleteAdmin);

module.exports = router;
