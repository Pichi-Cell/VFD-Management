const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendRepairEmail = async (to, subject, html) => {
    const info = await transporter.sendMail({
        from: `"VFD Workflow" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
    return info;
};
