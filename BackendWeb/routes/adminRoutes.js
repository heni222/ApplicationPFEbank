const express = require('express');
const router = express.Router();

const {
  getUsers,
  updateUserStatus,
  updateUserRole
} = require('../controller/adminController');

// 🔥 routes admin
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

module.exports = router;