const db = require('../db');

const smbClient = require('../utils/smbClient');
const path = require('path');
const fs = require('fs');

exports.uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { repair_id, step_name } = req.body;
    if (!repair_id) {
        return res.status(400).json({ msg: 'repair_id is required' });
    }

    const localPath = req.file.path;
    const filename = req.file.filename;

    try {
        // Upload to SMB
        await smbClient.uploadFile(localPath, filename);

        // Delete local copy
        fs.unlink(localPath, (err) => {
            if (err) console.error('Error deleting local temp file:', err.message);
        });

        const file_path = `/api/images/serve/${filename}`;

        const result = await db.query(
            'INSERT INTO vfd.repair_images (repair_id, step_name, file_path) VALUES ($1, $2, $3) RETURNING *',
            [repair_id, step_name, file_path]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Upload Image Error:', err.message);
        res.status(500).json({ msg: 'Server error while saving image to SMB', error: err.message });
    }
};

exports.serveImage = async (req, res) => {
    try {
        const data = await smbClient.getFileStream(req.params.filename);

        // Basic extension check for content type
        const ext = path.extname(req.params.filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

        res.set('Content-Type', contentType);
        res.send(data);
    } catch (err) {
        console.error('Serve Image Error:', err.message);
        res.status(404).json({ msg: 'Image not found on SMB server' });
    }
};

exports.getRepairImages = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM vfd.repair_images WHERE repair_id = $1 ORDER BY upload_date DESC',
            [req.params.repairId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Get Images Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching images', error: err.message });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const imageResult = await db.query(
            'SELECT * FROM vfd.repair_images WHERE id = $1',
            [req.params.id]
        );

        if (imageResult.rows.length === 0) return res.status(404).json({ msg: 'Image not found' });

        const filename = imageResult.rows[0].file_path.split('/').pop();

        // Delete from SMB
        try {
            await smbClient.deleteFile(filename);
        } catch (smbErr) {
            console.error('Error deleting from SMB:', smbErr.message);
        }

        await db.query('DELETE FROM vfd.repair_images WHERE id = $1', [req.params.id]);

        res.json({ msg: 'Image deleted' });
    } catch (err) {
        console.error('Delete Image Error:', err.message);
        res.status(500).json({ msg: 'Server error while deleting image', error: err.message });
    }
};
