const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Homework = require('../models/Homework');

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../homework');
        fs.mkdirSync(uploadPath, { recursive: true }); // Создание директории, если она не существует
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Получение домашних заданий для студента
exports.getHomeworkByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const homework = await Homework.find({ student_id: studentId })
            .sort({ dueDate: 1 });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Получение домашних заданий для группы
exports.getHomeworkByGroupId = async (req, res) => {
    try {
        const { groupId } = req.params;
        const homework = await Homework.find({ group_id: groupId })
            .sort({ dueDate: 1 });
        res.json(homework);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Добавление нового домашнего задания
exports.addHomeworkItem = [
    upload.array('files'),
    async (req, res) => {
        try {
            const { student_id, group_id, day, dueDate, comment } = req.body; // Добавьте comment
            const files = req.files ? req.files.map(file => file.filename) : [];

            // Валидация данных
            if (!student_id && !group_id) {
                return res.status(400).json({ error: 'Необходимо указать student_id или group_id' });
            }

            const newHomeworkItem = new Homework({
                student_id: student_id || undefined,
                group_id: group_id || undefined,
                day,
                dueDate: new Date(dueDate),
                files,
                comment, // Добавьте comment
                answer: [],
                grade: undefined,
                uploadedAt: new Date()
            });

            const savedHomeworkItem = await newHomeworkItem.save();
            res.json(savedHomeworkItem);
        } catch (error) {
            console.error('Error saving homework item:', error);
            res.status(500).json({ error: error.message || 'Ошибка при добавлении домашнего задания' });
        }
    }
];

// Обновление записи с загруженным файлом
exports.uploadAnswer = [
    upload.array('files'),
    async (req, res) => {
        const { homework_id, student_id } = req.body;
        const files = req.files.map(file => ({ student_id, file: file.filename }));

        try {
            const updatedHomework = await Homework.findByIdAndUpdate(
                homework_id,
                { $push: { answer: { $each: files } }, sentAt: new Date() },
                { new: true }
            );
            res.json(updatedHomework);
        } catch (error) {
            console.error('Error updating homework:', error);
            res.status(500).json({ error: 'Ошибка при обновлении домашнего задания' });
        }
    }
];

// Обновление оценки домашнего задания
exports.updateGrade = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade } = req.body;

        const updatedHomework = await Homework.findByIdAndUpdate(
            id,
            { grade: grade || undefined },
            { new: true }
        );

        if (!updatedHomework) {
            return res.status(404).json({ error: 'Домашнее задание не найдено' });
        }

        res.json(updatedHomework);
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({ error: 'Ошибка при обновлении оценки' });
    }
};

// Обновление оценки конкретного студента для домашнего задания
exports.updateStudentGrade = async (req, res) => {
    try {
        const { id, studentId } = req.params;
        const { grade } = req.body;

        const update = {};
        if (grade !== null && grade !== undefined) {
            update.$set = { [`grades.${studentId}`]: grade };
        } else {
            update.$unset = { [`grades.${studentId}`]: 1 };
        }

        const updatedHomework = await Homework.findByIdAndUpdate(
            id,
            update,
            { new: true }
        );

        if (!updatedHomework) {
            return res.status(404).json({ error: 'Домашнее задание не найдено' });
        }

        res.json(updatedHomework);
    } catch (error) {
        console.error('Error updating student grade:', error);
        res.status(500).json({ error: 'Ошибка при обновлении оценки студента' });
    }
};

// Удаление домашнего задания
exports.deleteHomework = async (req, res) => {
    try {
        const { id } = req.params;

        // Найти домашнее задание по ID
        const homework = await Homework.findById(id);
        if (!homework) {
            return res.status(404).json({ error: 'Домашнее задание не найдено' });
        }

        // Удалить файлы, связанные с домашним заданием
        const homeworkDir = path.join(__dirname, '../homework');
        for (const file of homework.files) {
            const filePath = path.join(homeworkDir, file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Удалить ответы студентов, если они есть
        for (const answer of homework.answer) {
            const answerFilePath = path.join(homeworkDir, answer.file);
            if (fs.existsSync(answerFilePath)) {
                fs.unlinkSync(answerFilePath);
            }
        }

        // Удалить запись из базы данных
        await Homework.findByIdAndDelete(id);

        res.json({ message: 'Домашнее задание успешно удалено' });
    } catch (error) {
        console.error('Ошибка при удалении домашнего задания:', error);
        res.status(500).json({ error: 'Ошибка при удалении домашнего задания' });
    }
};

// Массовое удаление домашних заданий
exports.deleteMultipleHomework = async (req, res) => {
    try {
        const { ids } = req.body;

        // Найти все домашние задания по ID
        const homeworks = await Homework.find({ _id: { $in: ids } });

        // Удалить файлы, связанные с домашними заданиями
        const homeworkDir = path.join(__dirname, '../homework');
        for (const homework of homeworks) {
            for (const file of homework.files) {
                const filePath = path.join(homeworkDir, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            // Удалить ответы студентов, если они есть
            for (const answer of homework.answer) {
                const answerFilePath = path.join(homeworkDir, answer.file);
                if (fs.existsSync(answerFilePath)) {
                    fs.unlinkSync(answerFilePath);
                }
            }
        }

        // Удалить записи из базы данных
        await Homework.deleteMany({ _id: { $in: ids } });

        res.json({ message: 'Домашние задания успешно удалены' });
    } catch (error) {
        console.error('Ошибка при массовом удалении домашних заданий:', error);
        res.status(500).json({ error: 'Ошибка при массовом удалении домашних заданий' });
    }
};

exports.deleteByStudent = async (req, res) => {
    try {
        const { student_id } = req.body;
        const result = await Homework.deleteMany({ student_id });
        res.json({ deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при удалении ДЗ' });
    }
};

// Удаление записей домашних заданий, связанных со студентом
exports.deleteByStudent = async (req, res) => {
  try {
    const { student_id } = req.body;

    // Удаляем записи, где студент указан как student_id
    await Homework.deleteMany({ student_id });

    // Для записей, где студент входит в группу, удаляем его данные из answer и grades
    await Homework.updateMany(
      { "grades": { $exists: true } },
      { $unset: { [`grades.${student_id}`]: 1 } }
    );

    await Homework.updateMany(
      {},
      { $pull: { answer: { student_id } } }
    );

    res.status(200).json({ message: 'Записи домашних заданий успешно удалены' });
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при удалении записей домашних заданий', error: error.message });
  }
};
