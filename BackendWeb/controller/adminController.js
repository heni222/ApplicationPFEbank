const User = require('../models/user');

// 🔥 GET all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 UPDATE status (ACTIVE / INACTIVE)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Statut mis à jour',
      user
    });

  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 UPDATE role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = ['ADMIN', 'USER', 'MANAGER'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Rôle mis à jour',
      user
    });

  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};