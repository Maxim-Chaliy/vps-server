const Schedule = require('../models/Schedule');
const { startOfDay, endOfDay } = require('date-fns');

exports.getDailyEmployment = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ error: 'Date parameter is required' });
        }

        const selectedDate = new Date(date);
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);

        // Получаем все занятия на выбранный день
        const schedules = await Schedule.find({
            date: { $gte: start, $lte: end }
        }).populate('student_id').populate('group_id');

        // Добавляем время окончания для каждого занятия
        const schedulesWithEndTime = schedules.map(schedule => {
            const lessonEnd = timeToMinutes(schedule.time) + schedule.duration;
            return {
                ...schedule.toObject(),
                endTime: minutesToTime(lessonEnd)
            };
        });

        res.json({
            totalLessons: schedules.length,
            schedules: schedulesWithEndTime
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.cancelLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLesson = await Schedule.findByIdAndDelete(id);

        if (!deletedLesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ message: 'Lesson canceled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const { date, time, duration, excludeId } = req.query;
        const lessonStart = timeToMinutes(time);
        const lessonEnd = lessonStart + parseInt(duration);

        const lessons = await Schedule.find({
            date: new Date(date),
            _id: { $ne: excludeId } // Исключаем текущее занятие из проверки
        });

        const isAvailable = !lessons.some(lesson => {
            const existingStart = timeToMinutes(lesson.time);
            const existingEnd = existingStart + lesson.duration;
            return (lessonStart < existingEnd && lessonEnd > existingStart);
        });

        res.json({ isAvailable });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.rescheduleLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time } = req.body;

        const updatedLesson = await Schedule.findByIdAndUpdate(
            id,
            {
                date: new Date(date),
                time,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedLesson) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        res.json(updatedLesson);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при переносе занятия' });
    }
};

// Вспомогательные функции
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
