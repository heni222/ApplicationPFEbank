// utils/createUploadsFolder.js
const fs = require('fs');
const path = require('path');

const createUploadsFolder = () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  const documentsDir = path.join(__dirname, '../uploads/documents');
  
  // Créer le dossier uploads s'il n'existe pas
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Dossier uploads créé');
  }
  
  // Créer le dossier documents s'il n'existe pas
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
    console.log('📁 Dossier uploads/documents créé');
  }
  
  console.log('✅ Dossiers d\'upload prêts');
};

module.exports = createUploadsFolder;