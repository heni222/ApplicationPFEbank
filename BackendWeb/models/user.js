const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    cin: { type: String, unique: true },
    dob: { type: Date },
    phone: { type: String },
    address: { type: String },
    city: { type: String },

    employeeId: { type: String, unique: true },
    branch: { type: String },
    department: { type: String },
    jobTitle: { type: String },
    manager: { type: String },
    status: { type: String, default: 'ACTIVE' },
    contractType: { type: String },
    startDate: { type: Date },

    email: { type: String, unique: true, lowercase: true, trim: true },
    role: { type: String },
    accessLevel: { type: String },
    mfaMethod: { type: String },
    enableFaceId: { type: Boolean, default: false },

    password: { type: String },
    terms: { type: Boolean },

    // Vérification email
    isVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String },
    emailVerifyTokenExpiresAt: { type: Date },

    // Reset password
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);