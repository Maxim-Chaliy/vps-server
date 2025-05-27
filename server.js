const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const setMatRoutes = require('./routes/setMatRoutes');
const educMatRoutes = require('./routes/educMatRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const groupRoutes = require('./routes/groupRoutes');
const employmentRoutes = require('./routes/employmentRoutes'); // Подключение маршрутов занятости
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/homework', express.static(path.join(__dirname, 'homework')));

// Подключение к базе данных
const uri = process.env.MONGODB_URI;
mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB');
    })
    .catch(err => {
        console.error('Error connecting to MongoDB', err);
    });

// Использование маршрутов
app.use('/', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/setmat', setMatRoutes);
app.use('/api/educmat', educMatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/employment', employmentRoutes); // Подключение маршрутов занятости
app.use('/api', applicationRoutes);

// Обработка 404 ошибок
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработка других ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});