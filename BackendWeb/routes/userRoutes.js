const router = require('express').Router();
const { upload } = require('../middelwares/Upload');
const { createUser } = require('../controller/UserController');

router.post('/create', upload.single('badgePhoto'), createUser);

module.exports = router;