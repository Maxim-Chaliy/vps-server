const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded; // Добавляем данные пользователя в запрос
        next();
    } catch (error) {
        res.status(401).send('Invalid token');
    }z
};

module.exports = verifyToken;