const User = require('../models/user');

// 🔥 GET all users
const getUsers = async (req, res) => {
  try {
    let query = {};
    const { status, role, search } = req.query;

    // Appliquer les filtres
    if (status) {
      query.status = status;
    }
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cin: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');

    res.status(200).json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 GET user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 CREATE user
const createUser = async (req, res) => {
  try {
    const { fullName, email, password, cin, phone, address, city, role, status } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const user = new User({
      fullName,
      email,
      password,
      cin,
      phone,
      address,
      city,
      role: role || 'USER',
      status: status || 'ACTIVE',
      permissions: req.body.permissions || []
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 UPDATE user
const updateUser = async (req, res) => {
  try {
    const { fullName, email, cin, phone, address, city } = req.body;

    // Vérifier si l'email n'est pas déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, cin, phone, address, city },
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
      message: 'Utilisateur mis à jour',
      user
    });
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 DELETE user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 UPDATE status (ACTIVE / INACTIVE)
const updateUserStatus = async (req, res) => {
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
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = ['ADMIN', 'USER', 'CREDIT', 'ANALYST'];

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

// 🔥 UPDATE permissions
const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions doit être un tableau'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
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
      message: 'Permissions mises à jour',
      user
    });
  } catch (error) {
    console.error('updatePermissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    // Hasher le mot de passe temporaire (à adapter selon votre modèle)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      temporaryPassword
    });
  } catch (error) {
    console.error('resetUserPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 Toggle user lock
const toggleUserLock = async (req, res) => {
  try {
    const { locked } = req.body;

    if (typeof locked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'locked doit être un boolean'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked: locked, lockedAt: locked ? new Date() : null },
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
      message: locked ? 'Utilisateur verrouillé' : 'Utilisateur déverrouillé',
      user
    });
  } catch (error) {
    console.error('toggleUserLock error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// ============================================
// GESTION DU PROFIL (ADMIN)
// ============================================

// 🔥 Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 Update profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, address, city, cin, photoUrl, newPassword } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (cin) updateData.cin = cin;
    if (photoUrl) updateData.photoUrl = photoUrl;
    
    // Gestion du changement de mot de passe
    if (newPassword) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
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
      message: 'Profil mis à jour avec succès',
      user
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// 🔥 Logout
const logout = async (req, res) => {
  try {
    // Ici vous pouvez implémenter la logique de blacklist du token
    // ou simplement renvoyer une confirmation
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};



module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  updatePermissions,
  resetUserPassword,
  toggleUserLock,
  getMe,
  updateProfile,
  logout
};