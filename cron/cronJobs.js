const cron = require('node-cron');
const User = require('../models/User');

// Задача для удаления неактивных пользователей
cron.schedule('0 * * * *', async () => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // Изменено на один час назад
        await User.deleteMany({
            isVerified: false,
            createdAt: { $lt: oneHourAgo }
        });
        console.log('Очистка неактивных пользователей выполнена');
    } catch (error) {
        console.error('Ошибка при очистке неактивных пользователей:', error);
    }
});
