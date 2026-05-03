const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Informations personnelles
    fullName: { type: String, required: true, trim: true },
    cin: { type: String, unique: true, sparse: true },
    dob: { type: Date },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    photoUrl: { type: String },

    // Informations professionnelles
    employeeId: { type: String, unique: true, sparse: true },
    branch: { type: String },
    department: { type: String },
    jobTitle: { type: String },
    manager: { type: String },
    contractType: { type: String },
    startDate: { type: Date },

    // Compte utilisateur
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    
    // Rôle et permissions
    role: { 
      type: String, 
      enum: ['ADMIN', 'USER', 'CREDIT', 'ANALYST'],
      default: 'USER' 
    },
    accessLevel: { type: String },
    permissions: { type: [String], default: [] },
    
    // Statut du compte
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE' 
    },
    isLocked: { type: Boolean, default: false },
    lockedAt: { type: Date },
    lastLogin: { type: Date },
    
    // Sécurité et MFA
    mfaMethod: { type: String },
    enableFaceId: { type: Boolean, default: false },

    // Vérification email
    isVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String },
    emailVerifyTokenExpiresAt: { type: Date },

    // Reset password
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    
    // Refresh token
    refreshToken: { type: String },
    refreshTokenExpiry: { type: Date },

    // Terms
    terms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ MIDDLEWARE CORRECT - NE PAS utiliser de fonction fléchée !
userSchema.pre('save', async function () {
  try {
    // Ne hacher que si password modifié
    if (!this.isModified('password')) return;

    console.log('💰 Hashing password...');

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    console.log('✅ Password hashed successfully');
  } catch (error) {
    console.error('❌ Hashing error:', error);
    throw error;
  }
});


// Méthode pour vérifier si le compte est actif
userSchema.methods.isActive = function() {
  return this.status === 'ACTIVE' && !this.isLocked;
};

// ⚠️ SUPPRIMEZ TOUS LES schema.index() - Laissez les indexes dans la définition du schéma
// Ne pas ajouter schema.index() ici pour éviter les doublons

module.exports = mongoose.model('User', userSchema);