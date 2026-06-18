const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '..');
const DEFAULT_UPLOAD_DIR = path.join(BACKEND_ROOT, '..', 'uploads');

const resolveUploadDir = (value = process.env.UPLOAD_DIR || process.env.UPLOADS_DIR) => {
    if (!value) return DEFAULT_UPLOAD_DIR;
    return path.isAbsolute(value) ? value : path.resolve(BACKEND_ROOT, value);
};

module.exports = {
    DEFAULT_UPLOAD_DIR,
    resolveUploadDir
};
