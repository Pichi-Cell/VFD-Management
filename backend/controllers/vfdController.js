const db = require('../db');

exports.getVfds = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT v.*, c.name as client_name, m.brand, m.model 
      FROM vfd.vfds v 
      LEFT JOIN vfd.clients c ON v.client_id = c.id 
      LEFT JOIN vfd.vfd_models m ON v.model_id = m.id 
      ORDER BY v.created_at DESC
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get VFDs Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching VFDs', error: err.message });
    }
};

exports.createVfd = async (req, res) => {
    if (!req.body || !req.body.serial_number || !req.body.client_id || !req.body.model_id) {
        return res.status(400).json({ msg: 'Please provide serial_number, client_id, and model_id' });
    }

    const { serial_number, internal_number, client_id, model_id } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO vfd.vfds (serial_number, internal_number, client_id, model_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [serial_number, internal_number, client_id, model_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create VFD Error:', err.message);
        res.status(500).json({ msg: 'Server error while creating VFD', error: err.message });
    }
};

exports.getVfdModels = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vfd.vfd_models ORDER BY brand, model');
        res.json(result.rows);
    } catch (err) {
        console.error('Get VFD Models Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching VFD models', error: err.message });
    }
};

exports.createVfdModel = async (req, res) => {
    if (!req.body || !req.body.brand || !req.body.model) {
        return res.status(400).json({ msg: 'Brand and model are required' });
    }

    const { brand, model, power, input_voltage } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO vfd.vfd_models (brand, model, power, input_voltage) VALUES ($1, $2, $3, $4) RETURNING *',
            [brand, model, power, input_voltage]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create VFD Model Error:', err.message);
        res.status(500).json({ msg: 'Server error while creating VFD model', error: err.message });
    }
};
exports.deleteVfdModel = async (req, res) => {
    try {
        await db.query('DELETE FROM vfd.vfd_models WHERE id = $1', [req.params.id]);
        res.json({ msg: 'VFD model removed' });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ msg: 'Cannot delete model: It has associated VFDs or repairs' });
        }
        console.error('Delete VFD Model Error:', err.message);
        res.status(500).json({ msg: 'Server error while deleting VFD model', error: err.message });
    }
};
