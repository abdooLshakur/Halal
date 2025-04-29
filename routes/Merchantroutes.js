// const express = require("express");
// const router = express.Router();
// const upload = require("../middleware/Fileuploads");
// const authenticateToken = require('../middleware/Auth');

// const { 
//     CreateMerchant, 
//     loginMerchant, 
//     updateMerchant, 
//     getAllMerchants,
//     getsingleMerchant,
//     verifyUser, 
//     deleteMerchant 
// } = require("../controllers/MerchantController");

// router.post("/api/register-merchant", upload.single('avatar'), CreateMerchant);
// router.post("/api/merchant-login", loginMerchant);
// router.put('/api/update-merchant/:id', authenticateToken, upload.single('avatar'), updateMerchant);
// router.put("/api/v1/user/verify_user", authenticateToken, verifyUser);
// router.get('/api/all-merchants', authenticateToken, getAllMerchants);
// router.get('/api/merchant', authenticateToken, getsingleMerchant);
// router.delete('/api/delete-merchant/:id', authenticateToken, deleteMerchant);

// module.exports = router;
