const express = require('express');
const router = express.Router();
const SetMat = require('../models/SetMatSchema'); // Подключение модели SetMat
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'files') {
            cb(null, 'uploads/materials'); // Папка для файлов
        } else if (file.fieldname === 'image') {
            cb(null, 'uploads/images'); // Папка для изображений
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Уникальное имя файла
    },
});

const upload = multer({ storage });

// Маршрут для получения всех материалов
router.get('/', async (req, res) => {
    try {
        const materials = await SetMat.find();
        res.status(200).json(materials);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        res.status(500).json({ message: 'Ошибка при получении данных' });
    }
});

// Маршрут для удаления записи по ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMaterial = await SetMat.findByIdAndDelete(id);

        if (!deletedMaterial) {
            return res.status(404).json({ message: 'Запись не найдена' });
        }

        // Удаляем файлы с сервера
        deletedMaterial.file.forEach((file) => {
            const filePath = path.join(__dirname, '../uploads/materials', file);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });

        deletedMaterial.image.forEach((image) => {
            const imagePath = path.join(__dirname, '../uploads/images', image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        res.status(200).json({ message: 'Запись и файлы успешно удалены' });
    } catch (error) {
        console.error('Ошибка при удалении записи:', error);
        res.status(500).json({ message: 'Ошибка при удалении записи' });
    }
});

// Маршрут для получения материала по ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const material = await SetMat.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }
        res.status(200).json(material);
    } catch (error) {
        console.error('Ошибка при получении материала:', error);
        res.status(500).json({ message: 'Ошибка при получении материала' });
    }
});

// // Маршрут для обновления материала по ID
// router.put('/:id', upload.fields([{ name: 'files', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
//     const { id } = req.params;
//     const { title, description, category, visibility, existingFiles, existingImage } = req.body;

//     try {
//         const material = await SetMat.findById(id);
//         if (!material) {
//             return res.status(404).json({ message: 'Материал не найден' });
//         }

//         // Обновляем текстовые данные
//         material.title = title;
//         material.description = description;
//         material.category = category;
//         material.visibility = visibility;

//         // Обработка файлов
//         if (req.files['files']) {
//             const newFiles = req.files['files'].map(file => file.filename);
//             material.file = [...existingFiles, ...newFiles]; // Сохраняем старые и новые файлы
//         } else {
//             material.file = existingFiles; // Только старые файлы
//         }

//         // Обработка изображения
//         if (req.files['image']) {
//             material.image = [req.files['image'][0].filename]; // Новое изображение
//         } else if (existingImage) {
//             material.image = [existingImage]; // Старое изображение
//         } else {
//             material.image = []; // Нет изображения
//         }

//         await material.save();
//         res.status(200).json(material);
//     } catch (error) {
//         console.error('Ошибка при обновлении материала:', error);
//         res.status(500).json({ message: 'Ошибка при обновлении материала' });
//     }
// });

module.exports = router;