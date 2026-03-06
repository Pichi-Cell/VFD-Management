const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// @route   POST api/images/upload
router.post('/upload', auth, upload.single('image'), imageController.uploadImage);

// @route   GET api/images/repair/:repairId
router.get('/repair/:repairId', auth, imageController.getRepairImages);

// @route   GET api/images/serve/:repairId/:filename
router.get('/serve/:repairId/:filename', auth, imageController.serveImage);

// @route   DELETE api/images/:id
router.delete('/:id', auth, imageController.deleteImage);

module.exports = router;
