const { VK } = require('vk-io');
const Comment = require('../models/Comment');

const vk = new VK({
  token: 'vk1.a.pogVJTG8u07Hb7D4mv4XLROyeVeG_6vFjxtGE-E1p-i7dua4xcE9I0NZPlmuTB--PyRjm53cHzRJC6678SDiLltDlN4mAmqJI47iQe_okCF6FACjaf9aOHBQ7VAvyDko8wMXBK8qW80152Vn-P8q_rpOMxD51uYCbOxumNFFod7KRlKwT4TMnzPhTFxz_gT8-2E5GeKt39hGXEXVbcy5zg' // Замени на свой токен доступа
});

const groupId = '216067267'; // ID группы
const topicId = '49113818'; // ID темы

// Функция для форматирования чисел в двузначный формат
function padNumber(number) {
  return number < 10 ? `0${number}` : number;
}

// Функция для получения комментариев из VK и сохранения их в базу данных
async function fetchAndSaveComments() {
  try {
    const comments = await vk.api.board.getComments({
      group_id: groupId,
      topic_id: topicId,
      count: 100
    });

    const userIds = comments.items.map(comment => comment.from_id);
    const users = await vk.api.users.get({
      user_ids: userIds.join(','),
      fields: 'photo_50'
    });

    const commentsWithAvatars = comments.items.map(comment => {
      const user = users.find(user => user.id === comment.from_id);
      if (!user || !user.last_name) {
        // console.error(`User with ID ${comment.from_id} does not have a last name`); // Закомментировано
        return null; // Пропускаем комментарий, если у пользователя нет фамилии
      }
      const date = new Date(comment.date * 1000);
      const formattedDate = `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

      return {
        ...comment,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          photo_50: user.photo_50
        },
        date: formattedDate // Преобразование Unix-времени в формат YYYY-MM-DD
      };
    }).filter(comment => comment !== null); // Удаляем комментарии с null

    // Сортировка комментариев по дате в порядке убывания
    commentsWithAvatars.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Сохранение комментариев в базу данных
    await Promise.all(commentsWithAvatars.map(async (comment) => {
      const existingComment = await Comment.findOne({ id: comment.id });
      if (!existingComment) {
        await Comment.create(comment);
      } else {
        // Обновление аватарки, если она изменилась
        if (existingComment.user.photo_50 !== comment.user.photo_50) {
          existingComment.user.photo_50 = comment.user.photo_50;
          await existingComment.save();
        }
      }
    }));

    // console.log('Комментарии успешно сохранены'); // Закомментировано
  } catch (error) {
    // console.error('Ошибка при получении комментариев:', error); // Закомментировано
  }
}

module.exports = { fetchAndSaveComments };
