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
        // Генерация уникального имени файла с суффиксом -educmat
        const timestamp = Date.now();
        let index = 1; // Начальное значение индекса

        if (file.fieldname === 'files') {
            // Индекс для учебных материалов
            index += req.files ? Object.keys(req.files['files'] || {}).length - 1 : 0;
        } else if (file.fieldname === 'image') {
            // Индекс для изображения
            index += req.files ? Object.keys(req.files['image'] || {}).length - 1 : 0;
        }

        const suffix = file.fieldname === 'image' ? '-image' : '';
        const filename = `${timestamp}-${index}-educmat${suffix}${path.extname(file.originalname)}`;
        cb(null, filename);
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

        // Удаляем изображение с сервера
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

// Маршрут для создания нового материала
router.post('/', upload.fields([{ name: 'files', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
    const { title, description, category, visibility } = req.body;
    const files = req.files['files'] ? req.files['files'].map(file => file.filename) : [];
    const image = req.files['image'] ? [req.files['image'][0].filename] : [];

    try {
        const setMat = new SetMat({
            title,
            description,
            category,
            visibility,
            file: files, // Сохраняем массив имён файлов
            image: image, // Сохраняем массив имён изображений
        });

        await setMat.save();
        res.status(201).json({ message: 'Материал успешно сохранен', material: setMat });
    } catch (error) {
        console.error('Ошибка при сохранении материала:', error);
        res.status(500).json({ message: 'Ошибка при сохранении материала' });
    }
});

// Маршрут для обновления материала по ID
router.put('/:id', upload.fields([{ name: 'files', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
    const { id } = req.params;
    const { title, description, category, visibility, existingFiles = [], existingImage = [] } = req.body;

    try {
        const material = await SetMat.findById(id);
        if (!material) {
            return res.status(404).json({ message: 'Материал не найден' });
        }

        // Обновляем текстовые данные
        material.title = title;
        material.description = description;
        material.category = category;
        material.visibility = visibility;

        // Обработка файлов
        if (req.files['files']) {
            // Если загружены новые файлы, добавляем их к существующим
            const newFiles = req.files['files'].map(file => file.filename);

            // Убедимся, что existingFiles - это массив
            const existingFilesArray = Array.isArray(existingFiles) ? existingFiles : [existingFiles];
            material.file = [...existingFilesArray, ...newFiles];
        } else {
            // Если файлы не загружены, сохраняем существующие
            // Убедимся, что existingFiles - это массив
            material.file = Array.isArray(existingFiles) ? existingFiles : [existingFiles];
        }

        // Обработка изображения
        if (req.files['image']) {
            // Если загружено новое изображение, заменяем старое
            material.image = [req.files['image'][0].filename];
        } else {
            // Если изображение не загружено, сохраняем существующее
            material.image = Array.isArray(existingImage) ? existingImage : [existingImage];
        }

        await material.save();
        res.status(200).json({ message: 'Материал успешно обновлен', material });
    } catch (error) {
        console.error('Ошибка при обновлении материала:', error);
        res.status(500).json({ message: 'Ошибка при обновлении материала' });
    }
});

module.exports = router;