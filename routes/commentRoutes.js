const express = require('express');
const { getComments } = require('../controllers/commentController');

const router = express.Router();

router.get('/db', getComments);

module.exports = router;
