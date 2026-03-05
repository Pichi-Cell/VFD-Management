const db = require('../db');

exports.getRepairs = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT r.*, v.serial_number, v.internal_number, c.name as client_name, m.brand, m.model
      FROM vfd.repairs r
      JOIN vfd.vfds v ON r.vfd_id = v.id
      JOIN vfd.clients c ON v.client_id = c.id
      JOIN vfd.vfd_models m ON v.model_id = m.id
      ORDER BY r.updated_at DESC
    `);
        res.json(result.rows);
    } catch (err) {
        console.error('Get Repairs Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching repairs', error: err.message });
    }
};

exports.getRepairById = async (req, res) => {
    try {
        const repairResult = await db.query(`
      SELECT r.*, v.serial_number, v.internal_number, c.name as client_name, m.brand, m.model, m.power, m.input_voltage, u.username as technician_name
      FROM vfd.repairs r
      JOIN vfd.vfds v ON r.vfd_id = v.id
      JOIN vfd.clients c ON v.client_id = c.id
      JOIN vfd.vfd_models m ON v.model_id = m.id
      LEFT JOIN vfd.users u ON r.technician_id = u.id
      WHERE r.id = $1
    `, [req.params.id]);

        if (repairResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Repair not found' });
        }

        const componentStatesResult = await db.query(
            'SELECT * FROM vfd.component_states WHERE repair_id = $1',
            [req.params.id]
        );

        const imagesResult = await db.query(
            'SELECT * FROM vfd.repair_images WHERE repair_id = $1',
            [req.params.id]
        );

        res.json({
            ...repairResult.rows[0],
            component_states: componentStatesResult.rows,
            images: imagesResult.rows
        });
    } catch (err) {
        console.error('Get Repair By Id Error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching repair details', error: err.message });
    }
};

exports.createRepair = async (req, res) => {
    if (!req.body || !req.body.vfd_id || !req.body.type) {
        return res.status(400).json({ msg: 'vfd_id and type are required' });
    }

    const { vfd_id, type, age, run_hours, connection_hours, fault_history, reported_fault } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO vfd.repairs (vfd_id, technician_id, type, age, run_hours, connection_hours, fault_history, reported_fault) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [vfd_id, req.user.id, type, age, run_hours, connection_hours, fault_history, reported_fault]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Create Repair Error:', err.message);
        res.status(500).json({ msg: 'Server error while creating repair', error: err.message });
    }
};

exports.updateRepairStatus = async (req, res) => {
    if (!req.body || !req.body.status) {
        return res.status(400).json({ msg: 'Status is required' });
    }

    const { status } = req.body;

    try {
        const result = await db.query(
            'UPDATE vfd.repairs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Status Error:', err.message);
        res.status(500).json({ msg: 'Server error while updating status', error: err.message });
    }
};

exports.updateRepairData = async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ msg: 'Repair ID is required' });
    }

    const { disassembly_obs, measurement_obs, testing_obs, final_conclusion } = req.body || {};

    try {
        const result = await db.query(
            `UPDATE vfd.repairs SET 
        disassembly_obs = COALESCE($1, disassembly_obs), 
        measurement_obs = COALESCE($2, measurement_obs), 
        testing_obs = COALESCE($3, testing_obs), 
        final_conclusion = COALESCE($4, final_conclusion),
        updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
            [disassembly_obs, measurement_obs, testing_obs, final_conclusion, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update Repair Data Error:', err.message);
        res.status(500).json({ msg: 'Server error while updating repair data', error: err.message });
    }
};

exports.upsertComponentState = async (req, res) => {
    if (!req.params.id || !req.body.component_name) {
        return res.status(400).json({ msg: 'Repair ID and component name are required' });
    }

    const { component_name, state, observations, proposed_solution } = req.body;

    try {
        // Use an UPSERT pattern
        const result = await db.query(`
      INSERT INTO vfd.component_states (repair_id, component_name, state, observations, proposed_solution)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (repair_id, component_name) DO UPDATE SET
        state = EXCLUDED.state,
        observations = EXCLUDED.observations,
        proposed_solution = EXCLUDED.proposed_solution
      RETURNING *
    `, [req.params.id, component_name, state, observations, proposed_solution]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Upsert Component State Error:', err.message);
        res.status(500).json({ msg: 'Server error while updating component state', error: err.message });
    }
};
