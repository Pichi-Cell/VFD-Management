const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const auth = require('../middleware/auth');

// @route   GET api/config
router.get('/', auth, configController.getConfig);

// @route   POST api/config
router.post('/', auth, configController.updateConfig);

module.exports = router;
