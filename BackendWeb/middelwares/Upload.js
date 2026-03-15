const multer = require('multer');

const storage = multer.memoryStorage(); // simple
const upload = multer({ storage });

module.exports = { upload };