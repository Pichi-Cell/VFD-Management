const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const auth = require('../middleware/auth');

// @route   GET api/repairs
router.get('/', auth, repairController.getRepairs);

// @route   GET api/repairs/:id
router.get('/:id', auth, repairController.getRepairById);

// @route   POST api/repairs
router.post('/', auth, repairController.createRepair);

// @route   PUT api/repairs/:id/status
router.put('/:id/status', auth, repairController.updateRepairStatus);

// @route   PUT api/repairs/:id/data
router.put('/:id/data', auth, repairController.updateRepairData);

// @route   POST api/repairs/:id/components
router.post('/:id/components', auth, repairController.upsertComponentState);

module.exports = router;
