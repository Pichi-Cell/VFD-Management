const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

const { clientValidation } = require('../middleware/validation');

// @route   GET api/clients
router.get('/', auth, clientController.getClients);

// @route   POST api/clients
router.post('/', auth, clientValidation, clientController.createClient);

// @route   DELETE api/clients/:id
router.delete('/:id', auth, clientController.deleteClient);

module.exports = router;
