const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    console.log("COOKIE TOKEN:", token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non autorisé",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED:", decoded);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Veuillez vérifier votre email",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }
};

module.exports = { protect };