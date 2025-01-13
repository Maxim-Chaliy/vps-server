const Comment = require('../models/Comment');
const { fetchAndSaveComments } = require('../utils/vk');

exports.getComments = async (req, res) => {
  const { page = 1, limit = 9 } = req.query;
  try {
    const comments = await Comment.find()
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)); // Преобразование limit в целое число

    const totalCount = await Comment.countDocuments();

    // Удалены строки с console.log для диагностики
    // console.log('Загруженные комментарии:', comments);
    // console.log('Общее количество комментариев:', totalCount);

    res.json({ comments, totalCount });
  } catch (error) {
    // Удалена строка с console.error для диагностики
    // console.error('Ошибка при получении комментариев из базы данных:', error);
    res.status(500).json({ error: 'Ошибка при получении комментариев из базы данных' });
  }
};

// Регулярный опрос API ВКонтакте
setInterval(fetchAndSaveComments, 60000); // Опрашиваем API каждые 60 секунд
