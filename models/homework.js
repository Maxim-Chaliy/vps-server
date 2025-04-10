const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
    student_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    day: { type: String, required: true },
    dueDate: { type: Date, required: true }, // Дата, до которой нужно выполнить задание
    files: { type: [String], required: true }, // Массив имен файлов или URL-адресов файлов
    answer: { type: [String], required: false }, // Массив имен файлов ответа
    grade: { type: Number, required: false }, // Оценка за задание
    uploadedAt: { type: Date, default: Date.now }, // Дата и время загрузки
    sentAt: { type: Date, required: false } // Дата и время отправки
});

const Homework = mongoose.model('Homework', homeworkSchema);

module.exports = Homework;
