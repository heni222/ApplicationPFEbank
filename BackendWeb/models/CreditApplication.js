const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['EN_ATTENTE', 'VALIDE', 'REJETE'], default: 'EN_ATTENTE' },
  validatedBy: { type: String, default: null }
});

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, enum: ['EN_ATTENTE', 'EN_ANALYSE', 'ACCEPTE', 'REFUSE'], required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, required: true },
  comment: { type: String, default: null }
});

// ✅ Sous-schema pour les données financières complémentaires (IA / scoring)
const aiFinancialDataSchema = new mongoose.Schema({
  account_age_months: { type: Number, default: null },
  avg_monthly_balance: { type: Number, default: null },
  num_deposits_per_month: { type: Number, default: null },
  avg_deposit_amount: { type: Number, default: null },
  num_withdrawals_per_month: { type: Number, default: null },
  avg_withdrawal_amount: { type: Number, default: null },
  debit_card_spending: { type: Number, default: null },
  credit_card_utilization: { type: Number, default: null },
  total_outstanding_debt: { type: Number, default: null },
  loan_application_amount: { type: Number, default: null }
}, { _id: false });

const creditApplicationSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'L\'ID client est requis']
  },
  // ✅ Données financières complémentaires (sous-document)
  aiFinancialData: {
    type: aiFinancialDataSchema,
    default: null
  },
  clientName: { type: String, required: true },
  amount: {
    type: Number,
    required: [true, 'Le montant du crédit est requis'],
    min: [1000, 'Le montant minimum est de 1000 DT'],
    max: [500000, 'Le montant maximum est de 500 000 DT']
  },
  duration: {
    type: Number,
    required: [true, 'La durée est requise'],
    min: [6, 'La durée minimum est de 6 mois'],
    max: [360, 'La durée maximum est de 360 mois (30 ans)']
  },
  monthlyPayment: { type: Number, required: true },
  interestRate: {
    type: Number,
    required: true,
    default: 5.5,
    min: [0, 'Le taux d\'intérêt ne peut pas être négatif'],
    max: [20, 'Le taux d\'intérêt maximum est de 20%']
  },
  purpose: {
    type: String,
    required: [true, 'Le but du crédit est requis'],
    enum: ['ACHAT_VEHICULE', 'ACHAT_IMMOBILIER', 'CONSOMMATION', 'TRAVAUX', 'AUTRE']
  },
  status: {
    type: String,
    enum: ['EN_ATTENTE', 'EN_ANALYSE', 'ACCEPTE', 'REFUSE'],
    default: 'EN_ATTENTE'
  },
  documents: [documentSchema],
  comments: [commentSchema],
  statusHistory: [statusHistorySchema],
  processedBy: { type: String, default: null },
  rejectionReason: { type: String, default: null }
}, {
  timestamps: true
});

// Index pour améliorer les performances
creditApplicationSchema.index({ clientId: 1 });
creditApplicationSchema.index({ status: 1 });
creditApplicationSchema.index({ createdAt: -1 });
creditApplicationSchema.index({ amount: 1 });

// Méthode pour vérifier si la transition de statut est valide
creditApplicationSchema.methods.isValidTransition = function (newStatus) {
  const transitions = {
    'EN_ATTENTE': ['EN_ANALYSE', 'REFUSE'],
    'EN_ANALYSE': ['ACCEPTE', 'REFUSE', 'EN_ATTENTE'],
    'ACCEPTE': [],
    'REFUSE': []
  };
  return transitions[this.status]?.includes(newStatus) || false;
};

// Méthode pour ajouter un statut à l'historique
creditApplicationSchema.methods.addToHistory = function (status, changedBy, comment = null) {
  this.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy,
    comment
  });
  this.status = status;
  this.updatedAt = new Date();

  if (status === 'ACCEPTE') {
    this.processedBy = changedBy;
  }
  if (status === 'REFUSE' && comment) {
    this.rejectionReason = comment;
  }
};

// ✅ PAS de middleware pre-save - validation faite dans le service

// Méthodes virtuelles
creditApplicationSchema.virtual('totalInterest').get(function () {
  return (this.monthlyPayment * this.duration) - this.amount;
});

creditApplicationSchema.virtual('totalCost').get(function () {
  return this.monthlyPayment * this.duration;
});

// ✅ Configuration toJSON pour inclure les virtuels ET les sous-documents
creditApplicationSchema.set('toJSON', { virtuals: true });
creditApplicationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CreditApplication', creditApplicationSchema);
