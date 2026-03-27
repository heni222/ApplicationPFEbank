const jwt = require("jsonwebtoken");
const User = require("../models/user");
const protect = async (req, res, next) => {
  try {
    // Vérifier le token dans le header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    let token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non autorisé",
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Vérifier si l'email est vérifié
      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: "Veuillez vérifier votre email",
          requiresVerification: true,
          email: user.email,
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
      error: error.message,
    });
  }
};

module.exports = { protect };
