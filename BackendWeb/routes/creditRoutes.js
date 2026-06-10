// routes/creditRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CreditController = require('../controller/creditController');

// S'assurer que le dossier existe avant chaque upload
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configuration Multer pour l'upload de documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    // Créer le dossier s'il n'existe pas
    ensureDirExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = 'doc-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    cb(new Error('Le fichier est trop volumineux. Maximum 5MB'), false);
    return;
  }
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez PDF, JPEG, PNG ou JPG'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// ========== Routes Clients ==========
// Créer un client
router.post('/clients', CreditController.createClient);
// Récupérer tous les clients
router.get('/clients', CreditController.getAllClients);
// Récupérer un client par ID
router.get('/clients/:id', CreditController.getClientById);
// Récupérer les applications d'un client
router.get('/clients/:id/applications', CreditController.getClientApplications);
// Mettre à jour un client
router.put('/clients/:id', CreditController.updateClient);
// Supprimer un client
router.delete('/clients/:id', CreditController.deleteClient);

// ========== Routes Applications de crédit ==========
// Créer une demande de crédit
router.post('/applications', CreditController.createApplication);
// Récupérer toutes les demandes (avec filtres optionnels)
router.get('/applications', CreditController.getApplications);
// Récupérer une demande par ID
router.get('/applications/:id', CreditController.getApplicationById);
// Mettre à jour le statut d'une demande
router.put('/applications/:id/status', CreditController.updateApplicationStatus);
// Ajouter un commentaire
router.post('/applications/:id/comments', CreditController.addComment);
// Upload de document
// Route d'upload de document
router.post('/applications/:id/documents', 
  upload.single('document'), 
  CreditController.uploadDocument
);

// Gestionnaire d'erreurs pour multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ message: 'Fichier trop volumineux. Maximum 5MB' });
    }
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

// Valider un document
router.put('/applications/:applicationId/documents/:documentId/validate', CreditController.validateDocument);
// ✅ Sauvegarder les données financières complémentaires (IA / scoring) dans application.aiFinancialData
router.put('/applications/:id/ai-financial-data', CreditController.saveFinancialData);
// Supprimer une demande
router.delete('/applications/:id', CreditController.deleteApplication);

// ========== Routes Statistiques ==========
// Récupérer les KPIs
router.get('/stats/kpis', CreditController.getKPIs);
// Récupérer les statistiques mensuelles
router.get('/stats/monthly', CreditController.getMonthlyStats);

module.exports = router;