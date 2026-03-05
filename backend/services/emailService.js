const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendRepairFinishedEmail = async (repair, clientEmail) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: clientEmail,
        subject: `Variador | ${repair.client_name} | ${repair.internal_number || repair.id} | ${repair.brand} ${repair.model}`,
        text: `Buenos días, envío el variador N°${repair.internal_number || repair.id} al que se le realizó una revisión completa.

Observaciones:
${repair.final_conclusion}

Recomendaciones:
Ver informe adjunto.

Saludos,
DMD Compresores`,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendRepairFinishedEmail };
