const express = require("express");
const router = express.Router();

const {
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  login,
  getProfile,
  logout,
} = require("../controller/authController");
const { protect } = require("../middelwares/auth");

router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post('/logout', logout);



// Routes protégées
router.get("/profile", protect, getProfile);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    user: {
      _id: req.user._id,
      fullName: req.user.fullName,
      cin: req.user.cin,
      dob: req.user.dob,
      phone: req.user.phone,
      address: req.user.address,
      city: req.user.city,
      employeeId: req.user.employeeId,
      branch: req.user.branch,
      department: req.user.department,
      jobTitle: req.user.jobTitle,
      manager: req.user.manager,
      status: req.user.status,
      contractType: req.user.contractType,
      startDate: req.user.startDate,
      email: req.user.email,
      role: req.user.role,
      accessLevel: req.user.accessLevel,
      mfaMethod: req.user.mfaMethod,
      enableFaceId: req.user.enableFaceId,
      isVerified: req.user.isVerified,
    },
  });
});
module.exports = router;
