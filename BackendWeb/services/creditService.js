const Client = require('../models/Client');
const CreditApplication = require('../models/CreditApplication');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

class CreditService {
  // ========== Services Clients ==========

  async createClient(clientData) {
    try {
      // Vérifier si le CIN ou l'email existe déjà
      const existingClient = await Client.findOne({
        $or: [{ cin: clientData.cin }, { email: clientData.email }]
      });

      if (existingClient) {
        throw new Error('Un client avec ce CIN ou cet email existe déjà');
      }

      const client = new Client(clientData);
      await client.save();
      return client;
    } catch (error) {
      throw error;
    }
  }

  async getAllClients() {
    try {
      return await Client.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  async getClientById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID client invalide');
      }
      return await Client.findById(id);
    } catch (error) {
      throw error;
    }
  }

  async getClientApplications(clientId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        throw new Error('ID client invalide');
      }
      return await CreditApplication.find({ clientId }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  }

  async updateClient(id, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID client invalide');
      }

      // Vérifier l'unicité du CIN/email si modifiés
      if (updateData.cin || updateData.email) {
        const existingClient = await Client.findOne({
          $or: [
            updateData.cin ? { cin: updateData.cin } : null,
            updateData.email ? { email: updateData.email } : null
          ].filter(Boolean),
          _id: { $ne: id }
        });

        if (existingClient) {
          throw new Error('CIN ou email déjà utilisé par un autre client');
        }
      }

      const client = await Client.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );

      // Mettre à jour le nom du client dans ses demandes de crédit
      if (client && updateData.fullName) {
        await CreditApplication.updateMany(
          { clientId: id },
          { clientName: client.fullName }
        );
      }

      return client;
    } catch (error) {
      throw error;
    }
  }

  async deleteClient(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID client invalide');
      }

      // Vérifier si le client a des demandes en cours
      const activeApplications = await CreditApplication.findOne({
        clientId: id,
        status: { $in: ['EN_ATTENTE', 'EN_ANALYSE'] }
      });

      if (activeApplications) {
        throw new Error('Impossible de supprimer un client avec des demandes de crédit en cours');
      }

      // Supprimer toutes les demandes du client
      await CreditApplication.deleteMany({ clientId: id });

      return await Client.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // ========== Services Applications de crédit ==========

  calculateMonthlyPayment(amount, duration, interestRate = 5.5) {
    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate === 0) return amount / duration;

    const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) /
      (Math.pow(1 + monthlyRate, duration) - 1);
    return Math.round(payment);
  }

  async createApplication(appData) {
    try {
      const client = await Client.findById(appData.clientId);
      if (!client) {
        throw new Error('Client non trouvé');
      }

      // Calculer la mensualité
      const monthlyPayment = this.calculateMonthlyPayment(
        appData.amount,
        appData.duration,
        5.5
      );

      // Vérifier le taux d'endettement
      const debtRatio = this.calculateDebtRatio(client, monthlyPayment);
      if (debtRatio > 50) {
        throw new Error(`Taux d'endettement trop élevé (${debtRatio}%). Maximum autorisé: 50%`);
      }

      const application = new CreditApplication({
        ...appData,
        clientName: client.fullName,
        monthlyPayment,
        interestRate: 5.5,
        status: 'EN_ATTENTE',
        statusHistory: [{
          status: 'EN_ATTENTE',
          changedBy: 'Système',
          changedAt: new Date()
        }],
        comments: [{
          userId: 'system',
          userName: 'Système',
          content: 'Demande de crédit créée',
          createdAt: new Date()
        }]
      });

      await application.save();
      return application;
    } catch (error) {
      throw error;
    }
  }

  async getApplications(filters = {}) {
    try {
      let query = {};

      if (filters.status && filters.status !== 'ALL') {
        query.status = filters.status;
      }

      if (filters.minAmount) {
        query.amount = { $gte: parseFloat(filters.minAmount) };
      }

      if (filters.maxAmount) {
        query.amount = { ...query.amount, $lte: parseFloat(filters.maxAmount) };
      }

      if (filters.search) {
        query.clientName = { $regex: filters.search, $options: 'i' };
      }

      return await CreditApplication.find(query)
        .sort({ createdAt: -1 })
        .populate('clientId', 'fullName email phone');
    } catch (error) {
      throw error;
    }
  }

  async getApplicationById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de demande invalide');
      }
      return await CreditApplication.findById(id).populate('clientId', 'fullName email phone revenue monthlyCharges existingLoans');
    } catch (error) {
      throw error;
    }
  }

  async updateApplicationStatus(id, newStatus, changedBy, comment = null) {
    try {
      const application = await CreditApplication.findById(id);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      if (!application.isValidTransition(newStatus)) {
        throw new Error(`Transition de statut invalide: ${application.status} → ${newStatus}`);
      }

      application.addToHistory(newStatus, changedBy, comment);

      if (comment) {
        application.comments.push({
          userId: changedBy,
          userName: changedBy,
          content: `Changement de statut vers ${this.getStatusLabel(newStatus)}: ${comment}`,
          createdAt: new Date()
        });
      }

      await application.save();
      return application;
    } catch (error) {
      throw error;
    }
  }

  async addComment(applicationId, content, userName) {
    try {
      const application = await CreditApplication.findById(applicationId);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      const comment = {
        userId: userName,
        userName: userName,
        content: content,
        createdAt: new Date()
      };

      application.comments.push(comment);
      await application.save();

      return comment;
    } catch (error) {
      throw error;
    }
  }

  async uploadDocument(applicationId, file) {
    try {
      const application = await CreditApplication.findById(applicationId);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      // Construire l'URL relative
      const relativePath = `/uploads/documents/${file.filename}`;

      const document = {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: relativePath,
        uploadedAt: new Date(),
        status: 'EN_ATTENTE'
      };

      application.documents.push(document);
      await application.save();

      return document;
    } catch (error) {
      // Supprimer le fichier en cas d'erreur
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Erreur lors de la suppression du fichier:', err);
        }
      }
      throw error;
    }
  }

  async validateDocument(applicationId, documentId, validatedBy) {
    try {
      const application = await CreditApplication.findById(applicationId);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      const document = application.documents.id(documentId);
      if (!document) {
        throw new Error('Document non trouvé');
      }

      document.status = 'VALIDE';
      document.validatedBy = validatedBy;

      await application.save();

      // Ajouter un commentaire automatique
      await this.addComment(
        applicationId,
        `Document "${document.name}" validé par ${validatedBy}`,
        'Système'
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  async deleteApplication(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de demande invalide');
      }

      const application = await CreditApplication.findById(id);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      // Ne pas supprimer les demandes déjà traitées
      if (application.status === 'ACCEPTE' || application.status === 'REFUSE') {
        throw new Error('Impossible de supprimer une demande déjà traitée');
      }

      return await CreditApplication.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // ✅ Données financières complémentaires (IA / scoring) — sauvegardées dans application.aiFinancialData
  async saveFinancialData(applicationId, data) {
    try {
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        throw new Error('ID de demande invalide');
      }

      const application = await CreditApplication.findById(applicationId);
      if (!application) {
        throw new Error('Demande non trouvée');
      }

      // Whitelist des champs autorisés pour éviter l'injection de champs arbitraires
      const allowed = [
        'account_age_months',
        'avg_monthly_balance',
        'num_deposits_per_month',
        'avg_deposit_amount',
        'num_withdrawals_per_month',
        'avg_withdrawal_amount',
        'debit_card_spending',
        'credit_card_utilization',
        'total_outstanding_debt',
        'loan_application_amount',
        'ia_risk_score'  
      ];
      const clean = {};
      for (const key of allowed) {
        if (data[key] !== undefined) clean[key] = data[key];
      }

      // ✅ On assigne le sous-document puis on persiste
      application.aiFinancialData = clean;
      await application.save();

      return application;
    } catch (error) {
      throw error;
    }
  }

  // ========== Services Statistiques ==========

  async getKPIs() {
    try {
      const stats = await CreditApplication.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'EN_ATTENTE'] }, 1, 0] } },
            analyzing: { $sum: { $cond: [{ $eq: ['$status', 'EN_ANALYSE'] }, 1, 0] } },
            accepted: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTE'] }, 1, 0] } },
            refused: { $sum: { $cond: [{ $eq: ['$status', 'REFUSE'] }, 1, 0] } },
            totalAmount: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTE'] }, '$amount', 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        pending: 0,
        analyzing: 0,
        accepted: 0,
        refused: 0,
        totalAmount: 0
      };

      result.approvalRate = result.total > 0
        ? Math.round((result.accepted / result.total) * 100)
        : 0;

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getMonthlyStats() {
    try {
      const stats = await CreditApplication.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        },
        {
          $limit: 12
        }
      ]);

      return stats.map(stat => ({
        month: new Date(stat._id.year, stat._id.month - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        count: stat.count,
        amount: stat.amount
      }));
    } catch (error) {
      throw error;
    }
  }

  // ========== Utilitaires ==========

  calculateDebtRatio(client, newMonthlyPayment) {
    const existingMonthlyPayments = client.existingLoans > 0 ? client.existingLoans / 240 : 0;
    const totalMonthlyPayments = client.monthlyCharges + existingMonthlyPayments + newMonthlyPayment;
    return Math.round((totalMonthlyPayments / client.revenue) * 100);
  }

  getStatusLabel(status) {
    const labels = {
      'EN_ATTENTE': 'En attente',
      'EN_ANALYSE': 'En analyse',
      'ACCEPTE': 'Accepté',
      'REFUSE': 'Refusé'
    };
    return labels[status] || status;
  }
}

module.exports = new CreditService();