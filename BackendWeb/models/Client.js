const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Le nom complet est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, "L'email est requis"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  phone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  address: {
    type: String,
    required: [true, "L'adresse est requise"],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'La ville est requise'],
    trim: true
  },
  cin: {
    type: String,
    required: [true, 'Le CIN est requis'],
    unique: true,
    trim: true
  },
  birthDate: {
    type: Date,
    required: [true, 'La date de naissance est requise']
  },

  gender: {
    type: String,
    required: [true, 'Le genre est requis'],
    enum: ['Male', 'Female', 'Other']
  },

  employmentStatus: {
    type: String,
    required: [true, "Le statut d'emploi est requis"],
    enum: ['Employed', 'Self-Employed', 'Unemployed']
  },

  profession: {
    type: String,
    required: [true, 'La profession est requise'],
    trim: true
  },
  employer: {
    type: String,
    required: [true, "L'employeur est requis"],
    trim: true
  },
  revenue: {
    type: Number,
    required: [true, 'Le revenu est requis'],
    min: [0, 'Le revenu ne peut pas être négatif']
  },
  monthlyCharges: {
    type: Number,
    required: [true, 'Les charges mensuelles sont requises'],
    min: [0, 'Les charges ne peuvent pas être négatives'],
    default: 0
  },
  existingLoans: {
    type: Number,
    required: true,
    min: [0, 'Les prêts existants ne peuvent pas être négatifs'],
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);