const db = require('../db');

exports.uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const { repair_id, step_name } = req.body;
    if (!repair_id) {
        return res.status(400).json({ msg: 'repair_id is required' });
    }

    const file_path = `/uploads/${req.file.filename}`;

    try {
        const result = await db.query(
            'INSERT INTO vfd.repair_images (repair_id, step_name, file_path) VALUES ($1, $2, $3) RETURNING *',
            [repair_id, step_name, file_path]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Upload Image Error:', err.message);
        res.status(500).json({ msg: 'Server error while saving image path', error: err.message });
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
        const result = await db.query(
            'DELETE FROM vfd.repair_images WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ msg: 'Image not found' });

        // Note: In a real app, you might want to delete the file from disk too.
        res.json({ msg: 'Image record deleted' });
    } catch (err) {
        console.error('Delete Image Error:', err.message);
        res.status(500).json({ msg: 'Server error while deleting image', error: err.message });
    }
};
