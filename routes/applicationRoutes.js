const express = require('express');
const applicationController = require('../controllers/applicationController');

const router = express.Router(); 

// Роут для создания заявки
router.post('/applications', applicationController.createApplication);

// Роут для получения всех заявок
router.get('/applications', applicationController.getApplications);

// Роут для обновления статуса заявки
router.put('/applications/status', applicationController.updateApplicationStatus);

// Роут для обновления комментария заявки
router.put('/applications/comment', applicationController.updateApplicationComment);

// Роут для удаления заявки
router.delete('/applications', applicationController.deleteApplication);

module.exports = router;
