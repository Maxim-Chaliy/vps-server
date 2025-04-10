const checkRole = (roles) => (req, res, next) => {
    const userRole = req.user.role; // Роль пользователя из токена
    if (!roles.includes(userRole)) {
        return res.status(403).send('Access denied');
    }
    next();
};

module.exports = checkRole;