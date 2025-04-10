const Homework = require('../models/homework');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Добавление нового домашнего задания
exports.addHomeworkItem = [
    upload.array('files'),
    async (req, res) => {
        const { student_id, day, dueDate, answer, grade } = req.body;
        const files = req.files.map(file => file.filename);

        console.log('Files:', files); // Отладочное сообщение
        console.log('Request Body:', req.body); // Отладочное сообщение

        try {
            const newHomeworkItem = new Homework({
                student_id,
                day,
                dueDate: new Date(dueDate),
                files,
                answer: answer ? answer.split(',') : [], // Преобразование answer в массив
                grade: grade !== 'null' ? Number(grade) : undefined, // Преобразование grade в число или undefined
                uploadedAt: new Date() // Автоматическое заполнение поля uploadedAt
            });

            const savedHomeworkItem = await newHomeworkItem.save();
            console.log('Saved Homework Item:', savedHomeworkItem); // Отладочное сообщение
            res.json(savedHomeworkItem);
        } catch (error) {
            console.error('Error saving homework item:', error); // Отладочное сообщение
            res.status(500).json({ error: 'Ошибка при добавлении домашнего задания' });
        }
    }
];

// Обновление записи с загруженным файлом
exports.uploadAnswer = [
    upload.array('files'),
    async (req, res) => {
        const { homework_id } = req.body;
        const files = req.files.map(file => file.filename);

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

// Получение домашнего задания для конкретного студента
exports.getHomeworkByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const homeworks = await Homework.find({ student_id: studentId });
        res.json(homeworks);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении домашнего задания' });
    }
};
