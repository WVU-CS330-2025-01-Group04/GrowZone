
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, checkAuth } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/authenticated', checkAuth);

module.exports = router;
