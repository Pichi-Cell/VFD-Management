const express = require('express');
const router = express.Router();
const vfdController = require('../controllers/vfdController');
const auth = require('../middleware/auth');

// @route   GET api/vfds
router.get('/', auth, vfdController.getVfds);

// @route   POST api/vfds
router.post('/', auth, vfdController.createVfd);

// @route   GET api/vfds/models
router.get('/models', auth, vfdController.getVfdModels);

// @route   POST api/vfds/models
router.post('/models', auth, vfdController.createVfdModel);

module.exports = router;
