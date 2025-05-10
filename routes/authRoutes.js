const express = require('express');
const { register, login, confirmEmail } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/confirm-email', confirmEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Пример маршрута, требующего аутентификации
router.get('/protected', authMiddleware, (req, res) => {
    res.send('This is a protected route');
});

// Пример маршрута, требующего роли админа
router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.send('This is an admin route');
});

module.exports = router;
