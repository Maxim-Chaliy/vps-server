const mongoose = require('mongoose');

// Определение схемы заявки
const applicationSchema = new mongoose.Schema({
    lastName: { type: String, required: true }, // Фамилия (обязательное поле)
    firstName: { type: String, required: true }, // Имя (обязательное поле)
    middleName: { type: String }, // Отчество (необязательное поле)
    email: { type: String, required: true }, // Email (обязательное поле)
    phone: { type: String, required: true }, // Телефон (обязательное поле)
    startTime: { type: String }, // Удобное время начала (необязательное поле)
    endTime: { type: String }, // Удобное время окончания (необязательное поле)
    classNumber: { type: String }, // Номер класса (необязательное поле)
    purpose: { type: String, default: 'Повышение успеваемости' }, // Цель занятий (значение по умолчанию)
    additionalInfo: { type: String }, // Дополнительная информация (необязательное поле)
    createdAt: { type: Date, default: Date.now }, // Дата создания заявки (автоматически заполняется)
    status: { type: String, default: 'Новая', enum: ['Новая', 'В работе', 'Завершена', 'Отклонена'] }, // Статус заявки
    comment: { type: String } // Комментарий (необязательное поле)
});

// Создание модели на основе схемы
const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;