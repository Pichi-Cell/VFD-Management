const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const multer = require('multer');

const handleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                msg: 'Uploaded image is too large',
                maxSizeBytes: upload.maxSize
            });
        }

        if (err.code === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ msg: err.message });
        }

        return res.status(400).json({ msg: 'Image upload failed', error: err.message });
    });
};

// @route   POST api/images/upload
router.post('/upload', auth, handleImageUpload, imageController.uploadImage);

// @route   GET api/images/repair/:repairId
router.get('/repair/:repairId', auth, imageController.getRepairImages);

// @route   GET api/images/serve/:repairId/:filename
router.get('/serve/:repairId/:filename', auth, imageController.serveImage);

// @route   DELETE api/images/:id
router.delete('/:id', auth, imageController.deleteImage);

module.exports = router;
