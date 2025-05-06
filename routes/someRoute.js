const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const router = express.Router();

// Пример маршрута, требующего аутентификации
router.get('/some-protected-route', authMiddleware, (req, res) => {
    res.send('This is a protected route');
});

// Пример маршрута, требующего роли админа
router.get('/admin-route', authMiddleware, adminMiddleware, (req, res) => {
    res.send('This is an admin route');
});

module.exports = router;
