const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
    // Sanity checks
    console.log(req);
    if (!req.body || !req.body.username || !req.body.password) {
        return res.status(400).json({ msg: 'Please provide both username and password' });
    }

    const { username, password, role } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM vfd.users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO vfd.users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, password_hash, role || 'technician']
        );

        const payload = { id: newUser.rows[0].id, role: newUser.rows[0].role };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: newUser.rows[0] });
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ msg: 'Server error during registration', error: err.message });
    }
};

exports.login = async (req, res) => {
    // Sanity checks
    if (!req.body || !req.body.username || !req.body.password) {
        return res.status(400).json({ msg: 'Please provide both username and password' });
    }

    const { username, password } = req.body;

    try {
        const userResult = await db.query('SELECT * FROM vfd.users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const payload = { id: userResult.rows[0].id, role: userResult.rows[0].role };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: userResult.rows[0].id, username: userResult.rows[0].username, role: userResult.rows[0].role } });
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ msg: 'Server error during login', error: err.message });
    }
};
