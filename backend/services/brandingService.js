const db = require('../db');
const { applyDefaults, rowsToConfig } = require('../config/configSchema');

class BrandingService {
    constructor() {
        this.defaults = applyDefaults({});
    }

    async getBranding() {
        try {
            const result = await db.query('SELECT key, value FROM vfd.settings');
            const config = applyDefaults(rowsToConfig(result?.rows || []));

            return {
                companyName: config.BRAND_COMPANY_NAME,
                departmentName: config.BRAND_DEPARTMENT_NAME,
                reportTitle: config.REPORT_TITLE,
                reportFooterText: config.REPORT_FOOTER_TEXT,
                emailSignatureName: config.EMAIL_SIGNATURE_NAME
            };
        } catch (err) {
            console.warn('[SYSTEM] Branding failed to load from DB, using defaults:', err.message);
            return {
                companyName: this.defaults.BRAND_COMPANY_NAME,
                departmentName: this.defaults.BRAND_DEPARTMENT_NAME,
                reportTitle: this.defaults.REPORT_TITLE,
                reportFooterText: this.defaults.REPORT_FOOTER_TEXT,
                emailSignatureName: this.defaults.EMAIL_SIGNATURE_NAME
            };
        }
    }
}

module.exports = new BrandingService();
