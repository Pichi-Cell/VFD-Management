const emailService = require('../services/emailService');
const db = require('../db');
const pdfService = require('../services/pdfService');

exports.sendFinishedNotification = async (req, res) => {
    const { repairId } = req.params;
    const { customObservations, customRecommendations } = req.body;

    try {
        const repairResult = await db.query(`
      SELECT r.*, v.serial_number, v.internal_number, c.name as client_name, c.contact_info as client_email, m.brand, m.model, u.username as technician_name
      FROM vfd.repairs r
      JOIN vfd.vfds v ON r.vfd_id = v.id
      JOIN vfd.clients c ON v.client_id = c.id
      JOIN vfd.vfd_models m ON v.model_id = m.id
      LEFT JOIN vfd.users u ON r.technician_id = u.id
      WHERE r.id = $1
    `, [repairId]);

        if (repairResult.rows.length === 0) return res.status(404).json({ msg: 'Repair not found' });
        const r = repairResult.rows[0];

        const stage = r.status;
        const subject = `Variador | ${r.client_name} | ${r.internal_number || r.serial_number} | ${r.brand} ${r.model} - [${stage}]`;

        let stageText = '';
        if (stage === 'Finished') {
            stageText = `<p>Buenos días, enviamos el variador N° <b>${r.internal_number || r.serial_number}</b> al que se le realizó una revisión completa y se encuentra finalizado.</p>`;
        } else if (stage === 'Received') {
            stageText = `<p>Buenos días, confirmamos la recepción del variador N° <b>${r.internal_number || r.serial_number}</b> para su revisión.</p>`;
        } else {
            stageText = `<p>Buenos días, le informamos sobre el estado actual (<b>${stage}</b>) del variador N° <b>${r.internal_number || r.serial_number}</b>.</p>`;
        }

        const html = `
            <div style="font-family: sans-serif; color: #334155; line-height: 1.6;">
                <h2 style="color: #0f172a;">Gestión de Variadores - DMD Compresores</h2>
                ${stageText}
                
                <h3 style="color: #3b82f6;">Detalles del Equipo:</h3>
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Cliente:</strong> ${r.client_name}</li>
                    <li><strong>Modelo:</strong> ${r.brand} ${r.model}</li>
                    <li><strong>Número de Serie:</strong> ${r.serial_number}</li>
                    ${r.internal_number ? `<li><strong>Número Interno:</strong> ${r.internal_number}</li>` : ''}
                </ul>

                <h3 style="color: #3b82f6;">Observaciones:</h3>
                <p style="background: #f8fafc; padding: 15px; border-radius: 8px;">${customObservations || r.final_conclusion || 'Sin observaciones adicionales.'}</p>

                ${customRecommendations ? `
                <h3 style="color: #3b82f6;">Recomendaciones:</h3>
                <p>${customRecommendations}</p>
                ` : ''}

                <p>Se adjunta el informe técnico detallado en formato PDF.</p>

                <br/>
                <p>Saludos cordiales,</p>
                <p><strong>Departamento de Desarrollo</strong><br/>DMD Compresores</p>
            </div>
        `;

        const targetEmail = r.client_email || process.env.EMAIL_USER;

        // Generate PDF
        const pdfBuffer = await pdfService.generateRepairPDF(r);

        await emailService.sendEmail(targetEmail, subject, html, [
            {
                filename: `Informe_${r.internal_number || r.serial_number}.pdf`,
                content: pdfBuffer
            }
        ]);

        res.json({ msg: 'Email sent successfully', to: targetEmail });
    } catch (err) {
        console.error('Send Email Error:', err.message);
        res.status(500).json({ msg: 'Failed to send email', error: err.message });
    }
};
