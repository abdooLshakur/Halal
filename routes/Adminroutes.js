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
    requestPasswordReset,
    resetPassword,
    getDashboardSummary,
    sendBroadcastEmail,
} = require("../controllers/AdminController");
const { manualactvateuser, getContactMessages } = require("../controllers/UserController");


router.post("/register-Admin", upload.single('avatar'), CreateAdmin);
router.post("/Admin-login", loginAdmin);
router.post("/admin/request-password-reset", requestPasswordReset);
router.post("/admin/reset-password", resetPassword);
router.get("/admin/dashboard-summary", Protected, getDashboardSummary);
router.post("/admin/broadcast-email", Protected, sendBroadcastEmail);
router.get("/admin/messages", Protected, getContactMessages);
router.get("/messages", Protected, getContactMessages);
router.put('/users/:userId/manualverify', Protected, manualactvateuser);
router.put('/admins/:userId/verify', Protected, verifyAdmin);
router.put('/update-Admin/:id',     Protected, upload.single('avatar'), updateAdmin);
router.get('/all-Admins', Protected, getAllAdmins);
router.get('/Admin/:id',  Protected, getsingleAdmin);
router.delete('/delete-Admin/:id',  Protected, deleteAdmin);

module.exports = router;
