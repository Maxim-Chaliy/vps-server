const express = require('express');
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const User = require('../models/User'); // Убедитесь, что модель User импортирована

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Маршрут для подтверждения email по токену
router.get('/confirm-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).send('Токен подтверждения отсутствует.');
        }

        const user = await User.findOne({ confirmationToken: token });

        if (!user) {
            return res.status(400).send('Неверный токен подтверждения.');
        }

        if (user.isVerified) {
            return res.status(200).send('Email уже подтвержден.');
        }

        // Обновляем статус пользователя
        user.isVerified = true;
        await user.save(); // Сохраняем изменения, но не удаляем токен

        // Отправляем успешный ответ
        res.status(200).send('Email подтвержден успешно! Теперь вы можете войти.');
    } catch (error) {
        console.error('Ошибка подтверждения email:', error);
        res.status(500).send('Внутренняя ошибка сервера при подтверждении email.');
    }
});

router.post('/remove-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).send('Токен отсутствует.');
    }

    const user = await User.findOne({ confirmationToken: token });

    if (user) {
      user.confirmationToken = undefined;
      await user.save();
    }

    res.status(200).send('Токен удален успешно.');
  } catch (error) {
    console.error('Ошибка удаления токена:', error);
    res.status(500).send('Внутренняя ошибка сервера при удалении токена.');
  }
});

// Пример маршрута, требующего аутентификации
router.get('/protected', authMiddleware, (req, res) => {
    res.send('This is a protected route');
});

// Пример маршрута, требующего роли админа
router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
    res.send('This is an admin route');
});

module.exports = router;
