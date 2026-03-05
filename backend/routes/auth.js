const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

// @route   GET api/auth
router.get('/', auth, authController.getUsers);

// @route   POST api/auth/register
router.post('/register', authController.register);

// @route   POST api/auth/login
router.post('/login', authController.login);

module.exports = router;
