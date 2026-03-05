const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const auth = require('../middleware/auth');

// @route   POST api/email/repair/:repairId
router.post('/repair/:repairId', auth, emailController.sendFinishedNotification);

module.exports = router;
