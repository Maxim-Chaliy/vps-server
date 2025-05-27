const Schedule = require('../models/Schedule');

// Получение расписания для конкретного студента
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

// Получение расписания для группы
exports.getScheduleByGroupId = async (req, res) => {
    try {
        const { groupId } = req.params;
        const schedules = await Schedule.find({ group_id: groupId })
            .sort({ date: 1, time: 1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получение расписания для группы со студентами
exports.getGroupScheduleWithStudents = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await mongoose.model('Group').findById(groupId).populate('students');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const schedules = await Schedule.find({ group_id: groupId })
            .sort({ date: 1, time: 1 });

        res.json({
            schedules,
            students: group.students
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Добавление нового занятия в расписание
exports.addScheduleItem = async (req, res) => {
    try {
        const { student_id, group_id, day, date, time, duration, subject, description } = req.body;

        console.log('Received data:', { student_id, group_id, day, date, time, duration, subject, description });

        // Проверка минимальной продолжительности
        if (duration < 30) {
            return res.status(400).json({
                error: 'Продолжительность должна быть не менее 30 минут'
            });
        }

        // Проверка, что указан либо student_id, либо group_id
        if (!student_id && !group_id) {
            return res.status(400).json({
                error: 'Необходимо указать либо student_id, либо group_id'
            });
        }

        // Преобразуем время для проверки
        const newDate = new Date(date);
        const newEndTime = calculateEndTime(time, duration);

        // Ищем ВСЕ занятия на эту дату (и групповые, и индивидуальные)
        const existingSchedules = await Schedule.find({
            date: {
                $gte: new Date(newDate.setHours(0, 0, 0, 0)),
                $lte: new Date(newDate.setHours(23, 59, 59, 999))
            }
        });

        console.log('Existing schedules:', existingSchedules);

        // Функция для преобразования времени в минуты
        const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStart = toMinutes(time);
        const newEnd = toMinutes(newEndTime);

        const hasConflict = existingSchedules.some(item => {
            // Исключаем текущую запись при обновлении
            if (req.params.id && item._id.toString() === req.params.id) {
                return false;
            }

            const existingStart = toMinutes(item.time);
            const existingEnd = toMinutes(calculateEndTime(item.time, item.duration));

            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (hasConflict) {
            return res.status(400).json({
                error: 'В выбранное время уже есть занятие. Пожалуйста, выберите другое время.'
            });
        }

        const newScheduleItem = new Schedule({
            student_id,
            group_id,
            day,
            date: new Date(date),
            time,
            duration: parseInt(duration),
            subject,
            description: description || '',
            attendance: student_id ? false : null,
            grade: null // или какое-то значение по умолчанию
        });


        const savedScheduleItem = await newScheduleItem.save();
        console.log('Saved schedule item:', savedScheduleItem);
        res.status(201).json(savedScheduleItem);
    } catch (error) {
        console.error('Ошибка при добавлении занятия в расписание:', error);
        res.status(500).json({
            error: 'Ошибка при добавлении занятия в расписание',
            details: error.message
        });
    }
};


// Вспомогательная функция для расчета времени окончания
function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// Обновление посещаемости (универсальное - для групп и индивидуальных занятий)
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { attendance, studentId } = req.body;

        const scheduleItem = await Schedule.findById(id);
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        // Если это индивидуальное занятие
        if (scheduleItem.student_id) {
            scheduleItem.attendance = attendance;
        }
        // Если это групповое занятие и передан studentId
        else if (scheduleItem.group_id && studentId) {
            if (!scheduleItem.attendance) {
                scheduleItem.attendance = {};
            }
            scheduleItem.attendance[studentId] = attendance;
            scheduleItem.markModified('attendance');
        } else {
            return res.status(400).json({
                error: 'Для групповых занятий необходимо указать studentId'
            });
        }

        scheduleItem.updatedAt = Date.now();
        const updatedItem = await scheduleItem.save();

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при обновлении посещаемости',
            details: error.message
        });
    }
};

// Массовое обновление посещаемости для группы
exports.updateGroupAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { attendance } = req.body; // { studentId: boolean }

        const scheduleItem = await Schedule.findById(id);
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        if (!scheduleItem.group_id) {
            return res.status(400).json({
                error: 'Это индивидуальное занятие. Используйте другой метод'
            });
        }

        scheduleItem.attendance = attendance;
        scheduleItem.markModified('attendance');
        scheduleItem.updatedAt = Date.now();
        const updatedItem = await scheduleItem.save();

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при обновлении посещаемости группы',
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

// Обновление оценок для групповых занятий
exports.updateGrades = async (req, res) => {
    try {
        const { id } = req.params;
        const { grades } = req.body;

        const scheduleItem = await Schedule.findById(id);
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        if (!scheduleItem.group_id) {
            return res.status(400).json({ error: 'Оценки группы можно обновлять только для групповых занятий' });
        }

        // Обновляем оценки
        scheduleItem.grades = grades;
        scheduleItem.markModified('grades');
        scheduleItem.updatedAt = Date.now();

        const updatedItem = await scheduleItem.save();
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при обновлении оценок',
            details: error.message
        });
    }
};

// Обновление оценки для индивидуального занятия
exports.updateGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade } = req.body;

        const scheduleItem = await Schedule.findById(id);
        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        scheduleItem.grade = grade;
        scheduleItem.updatedAt = Date.now();
        const updatedItem = await scheduleItem.save();

        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при обновлении оценки',
            details: error.message
        });
    }
};


// В scheduleController.js
exports.getScheduleItem = async (req, res) => {
    try {
        const { id } = req.params;
        const scheduleItem = await Schedule.findById(id);

        if (!scheduleItem) {
            return res.status(404).json({ error: 'Занятие не найдено' });
        }

        // Преобразуем grades Map в объект, если нужно
        const result = scheduleItem.toObject();
        if (scheduleItem.grades instanceof Map) {
            result.grades = Object.fromEntries(scheduleItem.grades);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Ошибка при получении занятия',
            details: error.message
        });
    }
};