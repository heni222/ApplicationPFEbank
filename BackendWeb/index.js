// "type": "commonjs"
// C'est la plus simple, la plus stable, et la plus utilisée avec Express
const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT;
const mongoDB = process.env.mongoDB;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Routes existantes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');

// Nouvelles routes pour le crédit
const creditRoutes = require('./routes/creditRoutes.js');

// MIDDLEWARES + ROUTES
// Ce middleware active le CORS (Cross-Origin Resource Sharing).
// En gros, il autorise ton backend à accepter des requêtes qui viennent d'autres domaines.
app.use(cors({
  origin: ['http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  // permet d'envoyer les cookies, tokens, headers sécurisés entre front et back.
  credentials: true
}));

// Ce middleware dit à Express :
// "Si la requête contient un corps en JSON, lis-le et transforme-le en objet JavaScript."
app.use(express.json());
// Celui-là permet à Express de lire les données envoyées depuis un formulaire HTML classique.
app.use(express.urlencoded({ extended: true }));
// Ce middleware permet à Express de lire les cookies envoyés par le navigateur.
app.use(cookieParser());

const fs = require('fs');
const path = require('path');

// CRÉER LE DOSSIER UPLOADS AU DÉMARRAGE
const createUploadsFolder = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const documentsDir = path.join(__dirname, 'uploads/documents');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Dossier uploads créé');
  }
  
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
    console.log('📁 Dossier uploads/documents créé');
  }
};

createUploadsFolder();

// Servir les fichiers statiques du dossier uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes existantes
app.use('/users', userRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Nouvelles routes pour le crédit
app.use('/api', creditRoutes);

// Route de test pour vérifier que l'API crédit fonctionne
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Credit API is running',
    timestamp: new Date()
  });
});

// CONNEXION MongoDB
const connect = async () => {
  try {
    await mongoose.connect(mongoDB);
    console.log("✅ MongoDB database connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};

connect();

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
  console.log(`Credit API disponible sur http://localhost:${PORT}/api`);
});