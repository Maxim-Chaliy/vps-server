const Schedule = require('../models/Schedule');

// Получить расписание для конкретного студента
exports.getScheduleByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const schedules = await Schedule.find({ student_id: studentId })
            .sort({ date: 1, time: 1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Добавление нового занятия в расписание
exports.addScheduleItem = async (req, res) => {
    try {
        const { student_id, day, date, time, duration, subject, description } = req.body;

        // Проверка минимальной продолжительности
        if (duration < 30) {
            return res.status(400).json({ 
                error: 'Продолжительность должна быть не менее 30 минут' 
            });
        }

        const newScheduleItem = new Schedule({
            student_id,
            day,
            date: new Date(date),
            time,
            duration: parseInt(duration),
            subject,
            description: description || ''
        });

        const savedScheduleItem = await newScheduleItem.save();
        res.status(201).json(savedScheduleItem);
    } catch (error) {
        res.status(500).json({ 
            error: 'Ошибка при добавлении занятия в расписание', 
            details: error.message 
        });
    }
};

// Обновление посещаемости
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { attendance } = req.body;

        const scheduleItem = await Schedule.findByIdAndUpdate(
            id, 
            { attendance }, 
            { new: true }
        );

        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        res.json(scheduleItem);
    } catch (error) {
        res.status(500).json({ 
            error: 'Ошибка при обновлении посещаемости', 
            details: error.message 
        });
    }
};

// Обновление записи в расписании
exports.updateScheduleItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, duration, subject, description } = req.body;

        // Проверка минимальной продолжительности
        if (duration < 30) {
            return res.status(400).json({ 
                error: 'Продолжительность должна быть не менее 30 минут' 
            });
        }

        const dateObj = new Date(date);
        const dayOfWeek = getShortDayOfWeek(dateObj);

        const updatedItem = await Schedule.findByIdAndUpdate(
            id,
            { 
                day: dayOfWeek, 
                date: dateObj, 
                time, 
                duration: parseInt(duration), 
                subject, 
                description,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ 
            error: 'Ошибка при обновлении записи в расписании', 
            details: error.message 
        });
    }
};

// Удаление записи из расписания
exports.deleteScheduleItem = async (req, res) => {
    try {
        const { id } = req.params;
        const scheduleItem = await Schedule.findByIdAndDelete(id);

        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        res.json({ 
            message: 'Занятие успешно удалено',
            deletedItem: scheduleItem
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Ошибка при удалении записи из расписания', 
            details: error.message 
        });
    }
};

// Удаление нескольких записей из расписания
exports.deleteMultipleScheduleItems = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ 
                error: 'Неверный формат данных: ожидается массив ID' 
            });
        }

        const deletedItems = await Schedule.deleteMany({ 
            _id: { $in: ids } 
        });

        if (deletedItems.deletedCount === 0) {
            return res.status(404).json({ 
                error: 'Записи не найдены или уже удалены' 
            });
        }

        res.json({ 
            message: 'Записи успешно удалены', 
            deletedCount: deletedItems.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Ошибка при удалении записей', 
            details: error.message 
        });
    }
};

// Вспомогательная функция для получения дня недели
function getShortDayOfWeek(date) {
    if (!date) return '';
    
    // Если date уже является объектом Date, используем как есть
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Проверка на валидность даты
    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const daysOfWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return daysOfWeek[dateObj.getDay()];
}