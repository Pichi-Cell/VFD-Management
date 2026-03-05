const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

// @route   GET api/clients
router.get('/', auth, clientController.getClients);

// @route   POST api/clients
router.post('/', auth, clientController.createClient);

module.exports = router;
