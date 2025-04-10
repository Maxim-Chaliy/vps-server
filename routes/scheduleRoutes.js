const express = require('express');
const { 
    getScheduleByStudentId,
    addScheduleItem,
    updateAttendance,
    updateScheduleItem,
    deleteScheduleItem,
    deleteMultipleScheduleItems
} = require('../controllers/scheduleController');

const router = express.Router();

router.get('/:studentId', getScheduleByStudentId);
router.post('/', addScheduleItem);
router.put('/:id/updateAttendance', updateAttendance);
router.put('/:id', updateScheduleItem);
router.delete('/:id', deleteScheduleItem);
router.post('/deleteMultiple', deleteMultipleScheduleItems);

module.exports = router;