const db = require('../db');
const storageService = require('../services/storageService');
const emailService = require('../services/emailService');
const {
    applyDefaults,
    maskSecrets,
    rowsToConfig,
    validateConfigUpdate
} = require('../config/configSchema');

exports.getConfig = async (req, res) => {
    try {
        const result = await db.query('SELECT key, value FROM vfd.settings');
        res.json(maskSecrets(applyDefaults(rowsToConfig(result.rows))));
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching config' });
    }
};

exports.updateConfig = async (req, res) => {
    const config = req.body;

    try {
        const existingResult = await db.query('SELECT key, value FROM vfd.settings');
        const existingConfig = rowsToConfig(existingResult.rows);
        const { values, errors } = validateConfigUpdate(config, {
            existingConfig,
            skipEmptySecrets: true
        });

        if (errors.length > 0) {
            return res.status(400).json({ msg: 'Invalid configuration', errors });
        }

        await db.query('BEGIN');

        for (const [key, value] of Object.entries(values)) {
            await db.query(
                'INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, value]
            );
        }

        await db.query('COMMIT');

        // Re-initialize services to apply changes
        await storageService.init();
        await emailService.init();

        res.json({ msg: 'Configuration updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Update Config Error:', err);
        res.status(500).json({ msg: 'Error updating config' });
    }
};
