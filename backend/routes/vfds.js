const express = require('express');
const router = express.Router();
const vfdController = require('../controllers/vfdController');
const auth = require('../middleware/auth');

const { vfdValidation } = require('../middleware/validation');

// @route   GET api/vfds
router.get('/', auth, vfdController.getVfds);

// @route   POST api/vfds
router.post('/', auth, vfdValidation, vfdController.createVfd);

// @route   GET api/vfds/models
router.get('/models', auth, vfdController.getVfdModels);

// @route   POST api/vfds/models
router.post('/models', auth, vfdController.createVfdModel);

// @route   DELETE api/vfds/models/:id
router.delete('/models/:id', auth, vfdController.deleteVfdModel);

module.exports = router;
