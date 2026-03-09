const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');

// @route   GET api/auth
router.get('/', auth, authController.getUsers);

// @route   GET api/auth/setup-status
router.get('/setup-status', authController.getSetupStatus);

// @route   POST api/auth/setup
router.post('/setup', authController.setup);

// @route   POST api/auth/register
router.post('/register', auth, registerValidation, authController.register);

// @route   POST api/auth/login
router.post('/login', loginValidation, authController.login);

// @route   PUT api/auth/:id
router.put('/:id', auth, authController.updateUser);

// @route   DELETE api/auth/:id
router.delete('/:id', auth, authController.deleteUser);

module.exports = router;
