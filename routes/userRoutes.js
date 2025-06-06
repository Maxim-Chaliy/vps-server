const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Другие маршруты...

// Маршрут для получения всех пользователей
router.get('/', userController.getUsers);

// Маршрут для получения всех студентов
router.get('/students', userController.getAllStudents);

// Маршрут для обновления роли пользователя
router.put('/:id/updateRole', userController.updateUserRole);

router.put('/:id/updateRole', userController.updateUserRole);

module.exports = router;
