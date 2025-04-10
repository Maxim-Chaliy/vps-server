const Application = require('../models/Application');
const axios = require('axios');

// Создание новой заявки
exports.createApplication = async (req, res) => {
    try {
        const { recaptchaToken, ...formData } = req.body;

        // 1. Проверка reCAPTCHA
        const recaptchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: recaptchaToken
                }
            }
        );

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({
                success: false,
                message: 'Не пройдена проверка reCAPTCHA. Пожалуйста, подтвердите, что вы не робот.'
            });
        }

        // 2. Проверка обязательных полей
        if (!formData.lastName || !formData.firstName || !formData.email || !formData.phone) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, заполните все обязательные поля: Фамилия, Имя, Email и Телефон.'
            });
        }

        // 3. Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, введите корректный email.'
            });
        }

        // 4. Валидация и форматирование телефона
        const cleanedPhone = formData.phone.replace(/[^+\d]/g, '');
        if (cleanedPhone.length !== 12 || !cleanedPhone.startsWith('+7')) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, введите корректный номер телефона в формате +7XXXXXXXXXX.'
            });
        }

        // 5. Проверка существующей заявки
        const existingApp = await Application.findOne({
            $or: [
                { phone: cleanedPhone },
                { email: formData.email }
            ]
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: 'Заявка с этим номером телефона или email уже существует.'
            });
        }

        // 6. Создание заявки
        const newApplication = new Application({
            lastName: formData.lastName,
            firstName: formData.firstName,
            middleName: formData.middleName || '',
            email: formData.email,
            phone: cleanedPhone,
            startTime: formData.startTime || '',
            endTime: formData.endTime || '',
            classNumber: formData.classNumber || '',
            purpose: formData.purpose || 'Повышение успеваемости',
            additionalInfo: formData.additionalInfo || '',
            status: 'Новая'
        });

        await newApplication.save();

        // 7. Отправка уведомления в Telegram
        try {
            const message = `
            📌 Новая заявка #${newApplication._id}
            👤 ФИО: ${formData.lastName} ${formData.firstName} ${formData.middleName || ''}
            📧 Email: ${formData.email}
            📞 Телефон: ${cleanedPhone}
            🎯 Цель: ${formData.purpose || 'Не указана'}
            🕒 Время: ${formData.startTime || 'Не указано'} - ${formData.endTime || 'Не указано'}
            📝 Доп. информация: ${formData.additionalInfo || 'Не указана'}
            `;

            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message
            });
        } catch (telegramError) {
            console.error('Ошибка отправки в Telegram:', telegramError);
            // Не прерываем выполнение, просто логируем ошибку
        }

        // 8. Успешный ответ
        res.status(201).json({
            success: true,
            message: 'Заявка успешно создана!',
            data: {
                id: newApplication._id,
                status: newApplication.status,
                createdAt: newApplication.createdAt
            }
        });

    } catch (error) {
        console.error('Ошибка создания заявки:', error);
        res.status(500).json({
            success: false,
            message: 'Произошла ошибка при создании заявки. Пожалуйста, попробуйте позже.'
        });
    }
};

// Получение всех заявок (для админки)
exports.getApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        const applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            data: applications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении заявок.'
        });
    }
};

// Обновление статуса заявки
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, укажите ID заявки и новый статус.'
            });
        }

        const validStatuses = ['Новая', 'В работе', 'Завершена', 'Отклонена'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Недопустимый статус заявки.'
            });
        }

        const updatedApplication = await Application.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedApplication) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена.'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedApplication
        });
    } catch (error) {
        console.error('Ошибка при обновлении статуса заявки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении статуса заявки.'
        });
    }
};

// Обновление комментария к заявке
exports.updateApplicationComment = async (req, res) => {
    try {
        const { id, comment } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Пожалуйста, укажите ID заявки.'
            });
        }

        const updatedApplication = await Application.findByIdAndUpdate(
            id,
            { comment },
            { new: true, runValidators: true }
        );

        if (!updatedApplication) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена.'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedApplication
        });
    } catch (error) {
        console.error('Ошибка при обновлении комментария заявки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении комментария заявки.'
        });
    }
};

// Удаление заявки
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Не указан ID заявки'
            });
        }

        const deletedApplication = await Application.findByIdAndDelete(id);

        if (!deletedApplication) {
            return res.status(404).json({
                success: false,
                message: 'Заявка не найдена'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Заявка успешно удалена',
            data: deletedApplication
        });
    } catch (error) {
        console.error('Ошибка при удалении заявки:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении заявки'
        });
    }
};
