const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET api/config
router.get('/', [auth, admin], configController.getConfig);

// @route   POST api/config
router.post('/', [auth, admin], configController.updateConfig);

module.exports = router;
