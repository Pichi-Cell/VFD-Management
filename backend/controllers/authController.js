const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
    // Sanity checks
    console.log(req);

    // Only admins can register new users
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Only administrators can create new users' });
    }

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

exports.getSetupStatus = async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) FROM vfd.users');
        const count = parseInt(result.rows[0].count, 10);
        res.json({ setupRequired: count === 0 });
    } catch (err) {
        console.error('Setup Status Error:', err.message);
        res.status(500).json({ msg: 'Server error checking setup status', error: err.message });
    }
};

exports.setup = async (req, res) => {
    // Check if setup is actually required
    try {
        const countResult = await db.query('SELECT COUNT(*) FROM vfd.users');
        const count = parseInt(countResult.rows[0].count, 10);
        if (count > 0) {
            return res.status(403).json({ msg: 'Setup has already been completed' });
        }
    } catch (err) {
        return res.status(500).json({ msg: 'Server error verifying setup status', error: err.message });
    }

    const { username, password, config } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please provide both username and password for the admin user' });
    }

    try {
        // Begin transaction
        await db.query('BEGIN');

        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO vfd.users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, password_hash, 'admin']
        );

        // Update settings if provided
        if (config && typeof config === 'object') {
            for (const [key, value] of Object.entries(config)) {
                await db.query(
                    'INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                    [key, String(value)]
                );
            }
        }

        await db.query('COMMIT');

        // Emit token to log in instantly
        const payload = { id: newUser.rows[0].id, role: newUser.rows[0].role };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                console.error('JWT Signing Error during setup:', err);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.json({ msg: 'Setup completed successfully', token, user: newUser.rows[0] });
        });

    } catch (err) {
        await db.query('ROLLBACK');
        console.error('Setup Error:', err.message);
        res.status(500).json({ msg: 'Server error during setup', error: err.message });
    }
};
exports.getUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role, created_at FROM vfd.users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Get Users Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching users', error: err.message });
    }
};
exports.updateUser = async (req, res) => {
    const { username, password, role } = req.body;
    const { id } = req.params;

    try {
        let query = 'UPDATE vfd.users SET username = $1, role = $2';
        let params = [username, role];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash = $3 WHERE id = $4';
            params.push(password_hash, id);
        } else {
            query += ' WHERE id = $3';
            params.push(id);
        }

        const result = await db.query(query + ' RETURNING id, username, role', params);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update User Error:', err.message);
        res.status(500).json({ msg: 'Server error while updating user', error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Set technician_id to NULL in repairs before deleting user to avoid FK error
        await db.query('UPDATE vfd.repairs SET technician_id = NULL WHERE technician_id = $1', [id]);
        const result = await db.query('DELETE FROM vfd.users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error('Delete User Error:', err.message);
        res.status(500).json({ msg: 'Server error while deleting user', error: err.message });
    }
};
