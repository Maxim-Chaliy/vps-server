const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.YANDEX_SMTP_USER,
        pass: process.env.YANDEX_SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.register = async (req, res) => {
    try {
        const { name, surname, patronymic, email, username, password, recaptchaToken } = req.body;

        if (!recaptchaToken) {
            return res.status(400).json({ error: 'reCAPTCHA token is required' });
        }

        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

        const recaptchaResponse = await axios.post(verificationUrl);

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({
                error: 'reCAPTCHA verification failed',
                details: recaptchaResponse.data['error-codes']
            });
        }

        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return res.status(400).json({
                    error: 'Пользователь с таким email уже зарегистрирован'
                });
            } else {
                await User.findByIdAndDelete(existingUserByEmail._id);
            }
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return res.status(400).json({
                error: 'Пользователь с таким логином уже зарегистрирован'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const confirmationToken = crypto.randomBytes(20).toString('hex');

        const user = new User({
            name,
            surname,
            patronymic: patronymic || '',
            email,
            username,
            password: hashedPassword,
            role: 'user',
            confirmationToken, // Сохраняем токен подтверждения
            isVerified: false
        });

        await user.save();

        const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;

        const mailOptions = {
            from: `"Easymath Service" <${process.env.YANDEX_SMTP_USER}>`,
            to: email,
            subject: 'Подтверждение регистрации в Easymath',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #2c3e50;">Здравствуйте,</h2>
                    <p>Для завершения регистрации в сервисе Easymath перейдите по следующей ссылке:</p>
                    <a href="${confirmationUrl}" style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #3498db; font-size: 18px; display: inline-block;">
                        Подтвердить email
                    </a>
                    <p>Если вы не запрашивали регистрацию, проигнорируйте это письмо.</p>
                    <p style="margin-top: 30px;">С уважением,<br>Команда Easymath</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'User registered successfully. Please check your email for the confirmation link.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                details: error.errors
            });
        }

        res.status(500).json({
            error: 'Internal server error during registration'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password, recaptchaToken } = req.body;

        if (!recaptchaToken) {
            return res.status(400).json({ error: 'Токен reCAPTCHA отсутствует' });
        }

        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

        const recaptchaResponse = await axios.post(verificationUrl);

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({
                error: 'Проверка reCAPTCHA не пройдена',
                details: recaptchaResponse.data['error-codes']
            });
        }

        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user) {
            return res.status(400).json({ error: 'Неверный email/логин или пароль' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный email/логин или пароль' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ error: 'Пожалуйста, подтвердите вашу электронную почту перед входом.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                surname: user.surname,
                patronymic: user.patronymic,
                email: user.email,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе в систему' });
    }
};

exports.confirmEmail = async (req, res) => {
    try {
        const { email, confirmationCode } = req.body;

        // Логирование данных запроса
        console.log('Received confirmation request:', { email, confirmationCode });

        const user = await User.findOne({ email });

        if (!user) {
            console.error('User not found for email:', email);
            return res.status(400).json({ error: 'User not found' });
        }

        if (user.confirmationCode !== confirmationCode) {
            console.error('Invalid confirmation code for email:', email);
            return res.status(400).json({ error: 'Invalid confirmation code' });
        }

        user.isVerified = true;
        user.confirmationCode = ''; // Устанавливаем пустую строку
        await user.save();

        res.status(200).json({ message: 'Email confirmed successfully' });

    } catch (error) {
        console.error('Email confirmation error:', error);
        res.status(500).json({ error: 'Internal server error during email confirmation' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body;

        if (!recaptchaToken) {
            return res.status(400).json({ error: 'reCAPTCHA token is required' });
        }

        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
        const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`;

        const recaptchaResponse = await axios.post(verificationUrl);

        if (!recaptchaResponse.data.success) {
            return res.status(400).json({
                error: 'reCAPTCHA verification failed',
                details: recaptchaResponse.data['error-codes']
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        // Генерация нового токена каждый раз
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpires = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        const resetUrl = `/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"Easymath Service" <${process.env.YANDEX_SMTP_USER}>`,
            to: email,
            subject: 'Сброс пароля',
            text: `Здравствуйте, ${user.username},\n\nДля сброса пароля перейдите по ссылке: ${resetUrl}\n\nС уважением,\nКоманда Easymath`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #2c3e50;">Здравствуйте, ${user.username}</h2>
                    <p>Для сброса пароля перейдите по ссылке:</p>
                    <a href="${resetUrl}" style="background: #f8f9fa; padding: 15px; margin: 20px 0;
                                border-left: 4px solid #3498db; font-size: 18px; display: inline-block;">
                        Сбросить пароль
                    </a>
                    <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                    <p style="margin-top: 30px;">С уважением,<br>Команда Easymath</p>
                </div>
            `,
            headers: {
                'X-Laziness-level': '1000',
                'X-Mailer': 'Nodemailer'
            }
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Password reset link sent to your email' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error during password reset request' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Токен сброса пароля недействителен или срок его действия истек' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error during password reset' });
    }
};