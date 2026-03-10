const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/cambiar-clave', authenticate, authController.cambiarClaveObligatoria);

module.exports = router;