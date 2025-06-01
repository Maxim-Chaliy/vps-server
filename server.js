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
const employmentRoutes = require('./routes/employmentRoutes');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware для логирования запросов
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

app.use(cors());
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
app.use('/api/employment', employmentRoutes);
app.use('/api', applicationRoutes);

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
