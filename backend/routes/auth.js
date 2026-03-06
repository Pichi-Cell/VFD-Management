const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middleware/auth');

// @route   GET api/auth
router.get('/', auth, authController.getUsers);

// @route   POST api/auth/register
router.post('/register', auth, authController.register);

// @route   POST api/auth/login
router.post('/login', authController.login);

// @route   PUT api/auth/:id
router.put('/:id', auth, authController.updateUser);

// @route   DELETE api/auth/:id
router.delete('/:id', auth, authController.deleteUser);

module.exports = router;
