const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const {
    register,
    login,
    getProfile,
    updateUser,
    deleteUser
} = require('../controllers/usercontroller');

router.post('/register', register);
router.post('/login', login);
router.get('/:id', authenticate, getProfile);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);

module.exports = router;