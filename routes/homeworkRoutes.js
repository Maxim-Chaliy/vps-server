const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');

// Получение домашних заданий для студента
router.get('/:studentId', homeworkController.getHomeworkByStudentId);

// Получение домашних заданий для группы
router.get('/group/:groupId', homeworkController.getHomeworkByGroupId);

// Добавление нового домашнего задания
router.post('/', homeworkController.addHomeworkItem);

// Загрузка ответа на домашнее задание
router.post('/upload-answer', homeworkController.uploadAnswer);

// Обновление оценки домашнего задания
router.put('/:id/grade', homeworkController.updateGrade);

// Обновление оценки конкретного студента для домашнего задания
router.put('/:id/grade/:studentId', homeworkController.updateStudentGrade);

// Удаление домашнего задания
router.delete('/:id', homeworkController.deleteHomework);

// Массовое удаление домашних заданий
router.post('/deleteMultiple', homeworkController.deleteMultipleHomework);

module.exports = router;