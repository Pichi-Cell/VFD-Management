const db = require('../db');
const storageService = require('../services/storageService');
const emailService = require('../services/emailService');

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
    const config = req.body; // Expecting an object { KEY: VALUE, ... }

    try {
        if (!config || typeof config !== 'object') {
            return res.status(400).json({ msg: 'Invalid configuration format' });
        }

        await db.query('BEGIN');

        for (const [key, value] of Object.entries(config)) {
            await db.query(
                'INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, String(value)]
            );
        }

        await db.query('COMMIT');

        // Re-initialize services to apply changes
        await storageService.init();
        await emailService.init();

        res.json({ msg: 'Configuration updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Update Config Error:', err.message);
        res.status(500).json({ msg: 'Error updating config', error: err.message });
    }
};
