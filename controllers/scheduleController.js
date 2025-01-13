const Schedule = require('../models/Schedule');

// Получение расписания студента
exports.getSchedule = async (req, res) => {
    const { studentId } = req.params;

    try {
        const schedule = await Schedule.find({ student_id: studentId });
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при получении расписания' });
    }
};

// Добавление нового занятия в расписание
exports.addScheduleItem = async (req, res) => {
    const { student_id, day, date, time, subject, description } = req.body;

    try {
        const newScheduleItem = new Schedule({
            student_id,
            day,
            date: new Date(date),
            time,
            subject,
            description
        });

        const savedScheduleItem = await newScheduleItem.save();
        res.json(savedScheduleItem);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при добавлении занятия в расписание' });
    }
};

// Обновление посещаемости
exports.updateAttendance = async (req, res) => {
    const { id } = req.params;
    const { attendance } = req.body;

    try {
        const scheduleItem = await Schedule.findByIdAndUpdate(id, { attendance }, { new: true });
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }
        res.json(scheduleItem);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении посещаемости' });
    }
};

// Обновление записи в расписании
exports.updateScheduleItem = async (req, res) => {
    const { id } = req.params;
    const { day, date, time, subject, description } = req.body;

    const dateObj = new Date(date);
    const dayOfWeek = getShortDayOfWeek(dateObj);

    try {
        const scheduleItem = await Schedule.findByIdAndUpdate(id, { day: dayOfWeek, date: dateObj, time, subject, description }, { new: true });
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }
        res.json(scheduleItem);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении записи в расписании' });
    }
};

// Удаление записи из расписания
exports.deleteScheduleItem = async (req, res) => {
    const { id } = req.params;

    try {
        const scheduleItem = await Schedule.findByIdAndDelete(id);
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }
        res.json({ message: 'Занятие успешно удалено' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении записи из расписания' });
    }
};

// Удаление нескольких записей из расписания
exports.deleteMultipleScheduleItems = async (req, res) => {
    const { ids } = req.body;

    try {
        const deletedItems = await Schedule.deleteMany({ _id: { $in: ids } });
        if (deletedItems.deletedCount === 0) {
            return res.status(404).json({ error: 'Записи не найдены' });
        }
        res.json({ message: 'Записи успешно удалены', deletedCount: deletedItems.deletedCount });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении записей' });
    }
};

// Функция для получения сокращенного названия дня недели
function getShortDayOfWeek(date) {
    const daysOfWeek = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    return daysOfWeek[date.getDay()];
}
