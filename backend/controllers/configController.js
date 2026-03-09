const db = require('../db');
const storageService = require('../services/storageService');

exports.getConfig = async (req, res) => {
    try {
        const result = await db.query('SELECT key, value FROM vfd.settings');
        const config = {};
        result.rows.forEach(row => {
            config[row.key] = row.value;
        });
        res.json(config);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching config' });
    }
};

exports.updateConfig = async (req, res) => {
    const { key, value } = req.body;
    try {
        if (key === 'STORAGE_TYPE') {
            await storageService.setType(value);
        } else {
            await db.query('INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, value]);
        }
        res.json({ msg: 'Config updated' });
    } catch (err) {
        res.status(500).json({ msg: 'Error updating config', error: err.message });
    }
};
