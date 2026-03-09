const nodemailer = require('nodemailer');
const db = require('../db');

/**
 * EmailService abstracts email operations.
 * It reads configuration from the database and falls back to environment variables.
 */
class EmailService {
    constructor() {
        this.config = {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
            rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false',
        };
        this.initialized = false;
        this.transporter = null;
    }

    async init() {
        try {
            const result = await db.query('SELECT key, value FROM vfd.settings');
            const settings = {};
            result.rows.forEach(row => {
                settings[row.key] = row.value;
            });

            // Fallback Logic: DB -> .env -> Default
            const hosts = [settings.EMAIL_HOST, process.env.EMAIL_HOST, 'smtp.gmail.com'];
            this.config.host = hosts.find(h => h !== undefined && h !== null);

            const ports = [settings.EMAIL_PORT, process.env.EMAIL_PORT, 587];
            this.config.port = parseInt(ports.find(p => p !== undefined && p !== null), 10);

            const secures = [settings.EMAIL_SECURE, process.env.EMAIL_SECURE, 'false'];
            this.config.secure = secures.find(s => s !== undefined && s !== null).toString() === 'true';

            const users = [settings.EMAIL_USER, process.env.EMAIL_USER];
            this.config.user = users.find(u => u !== undefined && u !== null);

            const passes = [settings.EMAIL_PASS, process.env.EMAIL_PASS];
            this.config.pass = passes.find(p => p !== undefined && p !== null);

            const rejects = [settings.EMAIL_REJECT_UNAUTHORIZED, process.env.EMAIL_REJECT_UNAUTHORIZED, 'true'];
            this.config.rejectUnauthorized = rejects.find(r => r !== undefined && r !== null).toString() === 'true';

            // Auto-Persistence: If from .env and not in DB, save it
            const saveSetting = async (key, val) => {
                if (val !== undefined && val !== null && !settings[key]) {
                    await db.query('INSERT INTO vfd.settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, val.toString()]);
                }
            };

            await saveSetting('EMAIL_HOST', process.env.EMAIL_HOST);
            await saveSetting('EMAIL_PORT', process.env.EMAIL_PORT);
            await saveSetting('EMAIL_SECURE', process.env.EMAIL_SECURE);
            await saveSetting('EMAIL_USER', process.env.EMAIL_USER);
            await saveSetting('EMAIL_PASS', process.env.EMAIL_PASS);
            await saveSetting('EMAIL_REJECT_UNAUTHORIZED', process.env.EMAIL_REJECT_UNAUTHORIZED);

            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.user,
                    pass: this.config.pass,
                },
                tls: {
                    rejectUnauthorized: this.config.rejectUnauthorized
                }
            });

            this.initialized = true;
            console.log(`[SYSTEM] EmailService initialized | Host: ${this.config.host}:${this.config.port} | Secure: ${this.config.secure} | TLS Reject: ${this.config.rejectUnauthorized}`);
        } catch (err) {
            console.warn('[SYSTEM] EmailService failed to init from DB, using fallback:', err.message);
            // Initialize transporter with fallback config
            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.user,
                    pass: this.config.pass,
                },
                tls: {
                    rejectUnauthorized: this.config.rejectUnauthorized
                }
            });
            this.initialized = true;
        }
    }

    async sendEmail(to, subject, html, attachments = []) {
        if (!this.initialized) await this.init();

        const info = await this.transporter.sendMail({
            from: `"VFD Workflow" <${this.config.user}>`,
            to,
            subject,
            html,
            attachments
        });
        return info;
    }

    async sendRepairFinishedEmail(repair, clientEmail) {
        if (!this.initialized) await this.init();

        const mailOptions = {
            from: `"VFD Workflow" <${this.config.user}>`,
            to: clientEmail,
            subject: `Variador | ${repair.client_name} | ${repair.internal_number || repair.id} | ${repair.brand} ${repair.model}`,
            text: `Buenos días, envío el variador N°${repair.internal_number || repair.id} al que se le realizó una revisión completa.\n\nObservaciones:\n${repair.final_conclusion}\n\nRecomendaciones:\nVer informe adjunto.\n\nSaludos,\nDMD Compresores`,
        };

        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService();
