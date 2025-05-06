const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Создание новой группы
router.post('/', groupController.createGroup);

// Получение всех групп
router.get('/', groupController.getAllGroups);

// Получение студентов группы
router.get('/:id/students', groupController.getGroupStudents);

// Добавление студента в группу
router.post('/:id/addStudent', groupController.addStudentToGroup);

// Удаление студента из группы
router.post('/:id/removeStudent', groupController.removeStudentFromGroup);

// Обновление группы
router.put('/:id', groupController.updateGroup);

// Удаление группы
router.delete('/:id', groupController.deleteGroup);

router.get('/student/:studentId', groupController.getGroupsByStudentId);

module.exports = router;