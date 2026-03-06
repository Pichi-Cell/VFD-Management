const db = require('../db');

const smbClient = require('../utils/smbClient');
const path = require('path');
const fs = require('fs');

const getRepairFolder = async (repair_id) => {
    const query = `
        SELECT 
            c.name as client_name,
            v.internal_number,
            m.model as vfd_model,
            r.entry_date
        FROM vfd.repairs r
        JOIN vfd.vfds v ON r.vfd_id = v.id
        JOIN vfd.clients c ON v.client_id = c.id
        JOIN vfd.vfd_models m ON v.model_id = m.id
        WHERE r.id = $1
    `;
    const result = await db.query(query, [repair_id]);
    if (result.rows.length === 0) throw new Error('Repair not found');

    const { client_name, internal_number, vfd_model, entry_date } = result.rows[0];

    // Format date as DD-MM-YY (as in user's example 18-12-25)
    // Using UTC to avoid timezone shifts for receipt date
    const d = new Date(entry_date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = String(d.getUTCFullYear()).slice(-2);
    const dateStr = `${day}-${month}-${year}`;

    // Clean names to remove spaces (as in user example "TeodoroFusile")
    const cleanClient = client_name.replace(/\s+/g, '');
    const cleanModel = vfd_model.replace(/\s+/g, '');

    // [ClientName]-[InternalID]-[Model]-[DATE]
    const folderName = `${cleanClient}-${internal_number}-${cleanModel}-${dateStr}`;
    return path.join(folderName, 'PHOTOS');
};

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
        const subFolder = await getRepairFolder(repair_id);

        // Upload to SMB in specific folder
        await smbClient.uploadFile(localPath, filename, subFolder);

        // Delete local copy
        fs.unlink(localPath, (err) => {
            if (err) console.error('Error deleting local temp file:', err.message);
        });

        // Store with repairId in the serve path
        const file_path = `/api/images/serve/${repair_id}/${filename}`;

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
        const { repairId, filename } = req.params;
        const subFolder = await getRepairFolder(repairId);

        const data = await smbClient.getFileBuffer(filename, subFolder);

        // Basic extension check for content type
        const ext = path.extname(filename).toLowerCase();
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

        const { repair_id, file_path } = imageResult.rows[0];
        const filename = file_path.split('/').pop();

        try {
            const subFolder = await getRepairFolder(repair_id);
            await smbClient.deleteFile(filename, subFolder);
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
