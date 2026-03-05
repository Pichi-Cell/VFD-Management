const db = require('../db');

exports.getClients = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vfd.clients ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Get Clients Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching clients', error: err.message });
    }
};

exports.createClient = async (req, res) => {
    if (!req.body || !req.body.name) {
        return res.status(400).json({ msg: 'Client name is required' });
    }

    const { name, contact_info } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO vfd.clients (name, contact_info) VALUES ($1, $2) RETURNING *',
            [name, contact_info]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create Client Error:', err.message);
        res.status(500).json({ msg: 'Server error while creating client', error: err.message });
    }
};
