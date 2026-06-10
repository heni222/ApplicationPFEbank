// controller/creditController.js
const CreditService = require('../services/creditService');

class CreditController {
  // ========== Clients ==========
  async createClient(req, res) {  // Pas de paramètre 'next' ici
    try {
      const client = await CreditService.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      // Utiliser res.status directement, pas next()
      res.status(400).json({ message: error.message });
    }
  }

  async getAllClients(req, res) {
      try {
        const clients = await CreditService.getAllClients();
        res.status(200).json(clients);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async getClientById(req, res) {
      try {
        const client = await CreditService.getClientById(req.params.id);
        if (!client) {
          return res.status(404).json({ message: 'Client non trouvé' });
        }
        res.status(200).json(client);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async getClientApplications(req, res) {
      try {
        const applications = await CreditService.getClientApplications(req.params.id);
        res.status(200).json(applications);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async updateClient(req, res) {
      try {
        const client = await CreditService.updateClient(req.params.id, req.body);
        if (!client) {
          return res.status(404).json({ message: 'Client non trouvé' });
        }
        res.status(200).json(client);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async deleteClient(req, res) {
      try {
        const result = await CreditService.deleteClient(req.params.id);
        if (!result) {
          return res.status(404).json({ message: 'Client non trouvé' });
        }
        res.status(200).json({ message: 'Client supprimé avec succès' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  // ========== Applications de crédit ==========
  async createApplication(req, res) {
      try {
        const application = await CreditService.createApplication(req.body);
        res.status(201).json(application);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async getApplications(req, res) {
      try {
        const { status, minAmount, maxAmount, search } = req.query;
        const filters = { status, minAmount, maxAmount, search };
        const applications = await CreditService.getApplications(filters);
        res.status(200).json(applications);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async getApplicationById(req, res) {
      try {
        const application = await CreditService.getApplicationById(req.params.id);
        if (!application) {
          return res.status(404).json({ message: 'Demande non trouvée' });
        }
        res.status(200).json(application);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async updateApplicationStatus(req, res) {
      try {
        const { newStatus, changedBy, comment } = req.body;
        const application = await CreditService.updateApplicationStatus(
          req.params.id,
          newStatus,
          changedBy,
          comment
        );
        res.status(200).json(application);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async addComment(req, res) {
      try {
        const { content, userName } = req.body;
        const comment = await CreditService.addComment(req.params.id, content, userName);
        res.status(201).json(comment);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async uploadDocument(req, res) {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'Aucun fichier uploadé' });
        }

        const document = await CreditService.uploadDocument(
          req.params.id,
          req.file
        );
        res.status(201).json(document);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async validateDocument(req, res) {
      try {
        const { applicationId, documentId } = req.params;
        const { validatedBy } = req.body;
        await CreditService.validateDocument(applicationId, documentId, validatedBy);
        res.status(200).json({ message: 'Document validé avec succès' });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    }

  async deleteApplication(req, res) {
      try {
        const result = await CreditService.deleteApplication(req.params.id);
        if (!result) {
          return res.status(404).json({ message: 'Demande non trouvée' });
        }
        res.status(200).json({ message: 'Demande supprimée avec succès' });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  // ✅ Sauvegarde des données financières complémentaires (IA / scoring)
  async saveFinancialData(req, res) {
    try {
      const application = await CreditService.saveFinancialData(
        req.params.id,
        req.body
      );
      res.status(200).json(application);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  // ========== Statistiques ==========
  async getKPIs(req, res) {
      try {
        const kpis = await CreditService.getKPIs();
        res.status(200).json(kpis);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }

  async getMonthlyStats(req, res) {
      try {
        const stats = await CreditService.getMonthlyStats();
        res.status(200).json(stats);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    }
  }

module.exports = new CreditController();