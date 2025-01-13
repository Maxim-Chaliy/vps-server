const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const userRoutes = require('./routes/userRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к базе данных
const uri = 'mongodb+srv://admin:admin@cluster0.yb3vt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});