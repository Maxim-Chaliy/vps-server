const express = require('express');
const { addHomeworkItem, getHomeworkByStudentId, uploadAnswer } = require('../controllers/homeworkController');

const router = express.Router();

// Маршрут для добавления нового домашнего задания
router.post('/', addHomeworkItem);

// Маршрут для получения домашнего задания по student_id
router.get('/:studentId', getHomeworkByStudentId);

// Маршрут для загрузки ответа на домашнее задание
router.post('/upload-answer', uploadAnswer);

// Другие маршруты...

module.exports = router;
