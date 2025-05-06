require('dotenv').config();
const nodemailer = require('nodemailer');

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

const mailOptions = {
    from: `"Easymath Service" <${process.env.YANDEX_SMTP_USER}>`,
    to: 'EasyMath5@yandex.ru', // Используйте реальный email
    subject: 'Ваш код доступа к Easymath',
    text: `Здравствуйте,\n\nДля завершения регистрации используйте код: 123456\n\nС уважением,\nКоманда Easymath`,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2c3e50;">Здравствуйте,</h2>
            <p>Для завершения регистрации в сервисе Easymath используйте следующий код:</p>
            <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; 
                        border-left: 4px solid #3498db; font-size: 18px;">
                123456
            </div>
            <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
            <p style="margin-top: 30px;">С уважением,<br>Команда Easymath</p>
        </div>
    `,
    headers: {
        'X-Laziness-level': '1000',
        'X-Mailer': 'Nodemailer'
    }
};

transporter.sendMail(mailOptions)
    .then(info => console.log('Sent:', info.messageId))
    .catch(err => console.error('Error:', err));