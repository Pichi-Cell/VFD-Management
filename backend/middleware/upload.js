const multer = require('multer');
const fs = require('fs');
const { resolveUploadDir } = require('../config/paths');

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const configuredMaxSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);
const maxSize = Number.isFinite(configuredMaxSize) && configuredMaxSize > 0
    ? configuredMaxSize
    : 10 * 1024 * 1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = resolveUploadDir();
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        return cb(null, true);
    }

    const error = new Error('Only JPEG, PNG, and WebP images are allowed');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error);
};

const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter
});

upload.allowedMimeTypes = allowedMimeTypes;
upload.maxSize = maxSize;

module.exports = upload;
