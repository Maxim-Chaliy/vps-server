const express = require('express');
const router = express.Router();
const employmentController = require('../controllers/employmentController');

// Убедитесь, что эти функции существуют в employmentController
router.get('/daily', employmentController.getDailyEmployment);
router.get('/check-availability', employmentController.checkAvailability);
router.put('/:id/reschedule', employmentController.rescheduleLesson);
router.delete('/:id', employmentController.cancelLesson);

module.exports = router;
