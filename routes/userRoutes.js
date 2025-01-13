const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/userController');

const router = express.Router();

router.get('/', getUsers);
router.put('/:id/updateRole', updateUserRole);

module.exports = router;
