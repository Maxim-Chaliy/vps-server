const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send({ error: 'Access denied. Admin role required.' });
    }
    next();
};

module.exports = adminMiddleware;
