const User = require("../models/user");
const crypto = require("crypto");
const EmailService = require("../services/emailService");
// ⚠️ NE PAS importer bcrypt ici - le modèle s'en occupe

async function createUser(req, res) {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // 🔥 IMPORTANT: Ne pas hacher le mot de passe ici
    // Le middleware pre('save') du modèle le fera automatiquement
    
    // Vérifier que les mots de passe correspondent
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Les mots de passe ne correspondent pas"
      });
    }

    // Créer l'utilisateur avec le mot de passe en clair
    const user = new User({
      fullName: req.body.fullName,
      cin: req.body.cin,
      dob: req.body.dob,
      phone: req.body.phone,
      address: req.body.address,
      city: req.body.city,

      employeeId: req.body.employeeId,
      branch: req.body.branch,
      department: req.body.department,
      jobTitle: req.body.jobTitle,
      manager: req.body.manager,

      status: req.body.status || "ACTIVE",
      contractType: req.body.contractType,
      startDate: req.body.startDate,

      email: req.body.email,
      role: req.body.role,
      accessLevel: req.body.accessLevel,
      mfaMethod: req.body.mfaMethod,

      enableFaceId: req.body.enableFaceId === "true" || req.body.enableFaceId === true,
      password: req.body.password, // ⚠️ En clair - sera haché par le middleware
      terms: req.body.terms === "true" || req.body.terms === true,

      isVerified: false,
    });

    // Sauvegarder l'utilisateur (le middleware pre('save') va hacher le password)
    await user.save();
    
    console.log("✅ User saved successfully, ID:", user._id);

    // Générer token de vérification
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.emailVerifyTokenHash = tokenHash;
    user.emailVerifyTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // Envoyer l'email de vérification
    let emailSent = true;
    try {
      await EmailService.sendVerificationEmail(user, rawToken);
      console.log(`✅ Email de vérification envoyé à ${user.email}`);
    } catch (mailErr) {
      emailSent = false;
      console.error("❌ ERREUR ENVOI EMAIL:", mailErr);
    }

    // Exclure le mot de passe de la réponse
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.emailVerifyTokenHash;
    delete userResponse.resetPasswordToken;

    // Réponse succès
    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: userResponse,
      emailSent,
      verificationInfo: {
        message: emailSent
          ? "Un email de vérification a été envoyé à votre adresse"
          : "Compte créé mais l'envoi de l'email a échoué. Veuillez contacter le support.",
        expiresIn: "1 heure",
      },
    });
  } catch (err) {
    console.error("❌ ERREUR CRÉATION UTILISATEUR:", err);

    // Gestion des erreurs
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Un utilisateur avec ce ${field} existe déjà`,
      });
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        error: "Erreur de validation",
        details: errors,
      });
    }

    return res.status(400).json({
      success: false,
      error: err.message || "Erreur lors de la création de l'utilisateur",
    });
  }
}

module.exports = {
  createUser,
};