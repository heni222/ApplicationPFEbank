const User = require("../models/user");
const EmailService = require("../services/emailService");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });
};

const verifyEmail = async (req, res) => {
  try {
    // LOGS DE DÉBOGAGE
    console.log("=== VERIFY EMAIL DEBUG ===");
    console.log("URL complète:", req.url);
    console.log("URL de base:", req.baseUrl);
    console.log("Chemin original:", req.originalUrl);
    console.log("Query params:", req.query);
    console.log("Token reçu:", req.query.token);
    console.log("==========================");

    const { token } = req.query;

    if (!token) {
      console.log("❌ Token manquant dans la requête");
      return res.status(400).json({
        success: false,
        message: "Token de vérification manquant",
      });
    }

    console.log("✅ Token reçu, longueur:", token.length);

    // Hasher le token pour le comparer avec celui stocké
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("Token hashé:", hashedToken);

    // ✅ CORRECTION : Utilisez les mêmes noms de champs que dans createUser
    const user = await User.findOne({
      emailVerifyTokenHash: hashedToken, // Changé ici
      emailVerifyTokenExpiresAt: { $gt: Date.now() }, // Changé ici
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé ou token expiré");

      // Vérifier si le token existe mais est expiré
      const expiredUser = await User.findOne({
        emailVerifyTokenHash: hashedToken, // Changé ici aussi
      });

      if (expiredUser) {
        console.log(
          "Token trouvé mais expiré. Expiration:",
          expiredUser.emailVerifyTokenExpiresAt,
        );
        return res.status(400).json({
          success: false,
          message: "Token expiré",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Token invalide",
      });
    }

    console.log("✅ Utilisateur trouvé:", user.email);
    console.log("Email vérifié actuellement:", user.isVerified);

    // Vérifier si déjà vérifié
    if (user.isVerified) {
      console.log("⚠️ Email déjà vérifié");
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà vérifié",
      });
    }

    // Mettre à jour l'utilisateur - Utilisez les mêmes noms de champs
    user.isVerified = true;
    user.emailVerifyTokenHash = undefined; // Changé ici
    user.emailVerifyTokenExpiresAt = undefined; // Changé ici
    await user.save();

    console.log("✅ Email vérifié avec succès pour:", user.email);

    // Optionnel: Envoyer un email de bienvenue
    try {
      await EmailService.sendWelcomeEmail(user);
    } catch (welcomeError) {
      console.log("Email de bienvenue non envoyé:", welcomeError.message);
    }

    res.status(200).json({
      success: true,
      message: "Email vérifié avec succès",
    });
  } catch (error) {
    console.error("❌ ERREUR:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
      error: error.message,
    });
  }
};

// @desc    Renvoyer l'email de vérification
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé avec cet email",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà vérifié",
      });
    }

    // Générer un nouveau token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Envoyer l'email
    await EmailService.sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: "Email de vérification renvoyé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du renvoi de l'email",
      error: error.message,
    });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email or password invalid" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log(user);
    if (!user) {
      return res.status(400).json({ message: "compte n'existe pas" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "compte non activé" });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({ message: "Email or password invalid" });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Erreur login :", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// @desc    Obtenir le profil utilisateur
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message,
    });
  }
};

module.exports = { getProfile, login, verifyEmail, resendVerificationEmail };
