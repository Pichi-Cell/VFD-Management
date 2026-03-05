const emailUtil = require('../utils/email');
const db = require('../db');

exports.sendFinishedNotification = async (req, res) => {
    const { repairId } = req.params;
    const { customObservations, customRecommendations } = req.body;

    try {
        const repairResult = await db.query(`
      SELECT r.*, v.serial_number, v.internal_number, c.name as client_name, c.contact_info as client_email, m.brand, m.model
      FROM vfd.repairs r
      JOIN vfd.vfds v ON r.vfd_id = v.id
      JOIN vfd.clients c ON v.client_id = c.id
      JOIN vfd.vfd_models m ON v.model_id = m.id
      WHERE r.id = $1
    `, [repairId]);

        if (repairResult.rows.length === 0) return res.status(404).json({ msg: 'Repair not found' });
        const r = repairResult.rows[0];

        const subject = `Variador | ${r.client_name} | ${r.internal_number || r.serial_number} | ${r.brand} ${r.model}`;

        const html = `
            <h2>Gestión de Variadores - DMD Compresores</h2>
            <p>Buenos días, envío el variador N° ${r.internal_number || r.serial_number} al que se le realizó una revisión completa.</p>
            
            <h3>Detalles del Equipo:</h3>
            <ul>
                <li><strong>Cliente:</strong> ${r.client_name}</li>
                <li><strong>Modelo:</strong> ${r.brand} ${r.model}</li>
                <li><strong>Número de Serie:</strong> ${r.serial_number}</li>
            </ul>

            <h3>Observaciones:</h3>
            <p>${customObservations || r.final_conclusion || 'Sin observaciones adicionales.'}</p>

            <h3>Recomendaciones:</h3>
            <p>${customRecommendations || 'Se recomienda seguir el plan de mantenimiento preventivo.'}</p>

            <br/>
            <p>Saludos cordiales,</p>
            <p><strong>Departamento de Desarrollo</strong><br/>DMD Compresores</p>
        `;

        // In a real scenario, we'd use r.client_email if it's a valid email, 
        // but for now let's allow sending to a test address or the tech email.
        const targetEmail = r.client_email || process.env.EMAIL_USER;

        await emailUtil.sendRepairEmail(targetEmail, subject, html);

        res.json({ msg: 'Email sent successfully', to: targetEmail });
    } catch (err) {
        console.error('Send Email Error:', err.message);
        res.status(500).json({ msg: 'Failed to send email', error: err.message });
    }
};
