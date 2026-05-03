const express = require('express');
const router = express.Router();

const {
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
} = require('../controller/adminController');

const { protect, authorize } = require('../middelwares/auth');

// Toutes les routes admin nécessitent une authentification et le rôle ADMIN
router.use(protect);
router.use(authorize('ADMIN'));

// 🔥 Gestion du profil
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/logout', logout);

// 🔥 Gestion des utilisateurs
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/permissions', updatePermissions);
router.post('/users/:id/reset-password', resetUserPassword);
router.put('/users/:id/lock', toggleUserLock);

module.exports = router;