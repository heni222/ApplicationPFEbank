const User = require("../models/user");
const crypto = require("crypto");
const EmailService = require("../services/emailService");
const bcrypt = require("bcryptjs"); // Ajoutez cette ligne

async function createUser(req, res) {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // ✅ HASHER LE MOT DE PASSE AVANT CRÉATION
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // ✅ 1) Créer l'utilisateur avec le mot de passe haché
    const user = await User.create({
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

      enableFaceId:
        req.body.enableFaceId === "true" || req.body.enableFaceId === true,
      password: hashedPassword, // Utiliser le mot de passe haché
      terms: req.body.terms === "true" || req.body.terms === true,

      isVerified: false,
    });

    // ✅ 2) Générer token après création
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.emailVerifyTokenHash = tokenHash;
    user.emailVerifyTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    // ✅ 3) Envoyer l’email avec le template HTML professionnel
    let emailSent = true;
    try {
      // Utiliser le service d'email avec le template complet
      await EmailService.sendVerificationEmail(user, rawToken);
      console.log(`✅ Email de vérification envoyé à ${user.email}`);
    } catch (mailErr) {
      emailSent = false;
      console.error("❌ ERREUR ENVOI EMAIL:", mailErr);
    }

    // ✅ 4) Réponse OK avec informations détaillées
    return res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
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

    // Gestion plus détaillée des erreurs
    if (err.code === 11000) {
      // Erreur de duplication (email ou employeeId déjà existant)
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `Un utilisateur avec ce ${field} existe déjà`,
      });
    }

    if (err.name === "ValidationError") {
      // Erreur de validation mongoose
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