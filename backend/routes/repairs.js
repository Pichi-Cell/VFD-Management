const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const auth = require('../middleware/auth');
const { body, validate } = require('../middleware/validation');
const { repairValidation, repairUpdateValidation } = require('../middleware/validation');

// @route   GET api/repairs
router.get('/', auth, repairController.getRepairs);

// @route   GET api/repairs/:id
router.get('/:id', auth, repairController.getRepairById);

// @route   POST api/repairs
router.post('/', [auth, ...repairValidation], repairController.createRepair);

// @route   PUT api/repairs/:id/status
router.put('/:id/status', [auth, body('status').isString().notEmpty(), validate], repairController.updateRepairStatus);

// @route   PUT api/repairs/:id/data
router.put('/:id/data', [auth, ...repairUpdateValidation], repairController.updateRepairData);

// @route   POST api/repairs/:id/components
router.post('/:id/components', [auth, body('component_name').isString().notEmpty(), body('state').isString(), validate], repairController.upsertComponentState);

// @route   PUT api/repairs/:id/visibility
router.put('/:id/visibility', auth, repairController.updateRepairVisibility);

// @route   DELETE api/repairs/:id
router.delete('/:id', auth, repairController.deleteRepair);

// @route   GET api/repairs/:id/pdf
router.get('/:id/pdf', auth, repairController.downloadPDF);

module.exports = router;
