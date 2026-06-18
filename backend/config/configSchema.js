const SECRET_PLACEHOLDER = '';

const DEFAULT_BRANDING = {
    BRAND_COMPANY_NAME: 'DMD Compresores',
    BRAND_DEPARTMENT_NAME: 'Depto. de Desarrollo',
    REPORT_TITLE: 'Informe T\u00e9cnico',
    REPORT_FOOTER_TEXT: 'Documento generado por el sistema de gesti\u00f3n de variadores - DMD Compresores',
    EMAIL_SIGNATURE_NAME: 'Departamento de Desarrollo'
};

const CONFIG_SCHEMA = {
    STORAGE_TYPE: {
        type: 'enum',
        values: ['LOCAL', 'SMB'],
        default: 'LOCAL',
        adminEditable: true
    },
    UPLOAD_DIR: {
        type: 'string',
        default: '/app/uploads',
        adminEditable: true,
        requiredWhen: (config) => config.STORAGE_TYPE === 'LOCAL'
    },
    SMB_HOST: {
        type: 'string',
        default: '',
        adminEditable: true,
        requiredWhen: (config) => config.STORAGE_TYPE === 'SMB'
    },
    SMB_SHARE: {
        type: 'string',
        default: '',
        adminEditable: true,
        requiredWhen: (config) => config.STORAGE_TYPE === 'SMB'
    },
    SMB_USER: {
        type: 'string',
        default: '',
        adminEditable: true,
        requiredWhen: (config) => config.STORAGE_TYPE === 'SMB'
    },
    SMB_PASS: {
        type: 'string',
        default: '',
        secret: true,
        adminEditable: true,
        requiredWhen: (config) => config.STORAGE_TYPE === 'SMB'
    },
    SMB_BASE_PATH: {
        type: 'string',
        default: '',
        adminEditable: true
    },
    EMAIL_HOST: {
        type: 'string',
        default: 'smtp.gmail.com',
        adminEditable: true
    },
    EMAIL_PORT: {
        type: 'number',
        default: '587',
        min: 1,
        max: 65535,
        adminEditable: true
    },
    EMAIL_SECURE: {
        type: 'boolean',
        default: 'false',
        adminEditable: true
    },
    EMAIL_USER: {
        type: 'string',
        default: '',
        adminEditable: true
    },
    EMAIL_PASS: {
        type: 'string',
        default: '',
        secret: true,
        adminEditable: true
    },
    EMAIL_REJECT_UNAUTHORIZED: {
        type: 'boolean',
        default: 'true',
        adminEditable: true
    },
    EMAIL_FROM_NAME: {
        type: 'string',
        default: 'VFD Workflow',
        adminEditable: true
    },
    BRAND_COMPANY_NAME: {
        type: 'string',
        default: DEFAULT_BRANDING.BRAND_COMPANY_NAME,
        adminEditable: true
    },
    BRAND_DEPARTMENT_NAME: {
        type: 'string',
        default: DEFAULT_BRANDING.BRAND_DEPARTMENT_NAME,
        adminEditable: true
    },
    REPORT_TITLE: {
        type: 'string',
        default: DEFAULT_BRANDING.REPORT_TITLE,
        adminEditable: true
    },
    REPORT_FOOTER_TEXT: {
        type: 'string',
        default: DEFAULT_BRANDING.REPORT_FOOTER_TEXT,
        adminEditable: true
    },
    EMAIL_SIGNATURE_NAME: {
        type: 'string',
        default: DEFAULT_BRANDING.EMAIL_SIGNATURE_NAME,
        adminEditable: true
    }
};

const rowsToConfig = (rows = []) => {
    const config = {};
    rows.forEach((row) => {
        config[row.key] = row.value;
    });
    return config;
};

const applyDefaults = (config = {}) => {
    const withDefaults = {};
    Object.entries(CONFIG_SCHEMA).forEach(([key, schema]) => {
        withDefaults[key] = config[key] ?? schema.default ?? '';
    });
    return withDefaults;
};

const maskSecrets = (config = {}) => {
    const masked = { ...config };
    Object.entries(CONFIG_SCHEMA).forEach(([key, schema]) => {
        if (schema.secret && Object.prototype.hasOwnProperty.call(masked, key)) {
            masked[key] = SECRET_PLACEHOLDER;
        }
    });
    return masked;
};

const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

const normalizeValue = (key, value) => {
    const schema = CONFIG_SCHEMA[key];

    if (schema.type === 'boolean') {
        if (typeof value === 'boolean') return value.toString();
        const normalized = String(value).trim().toLowerCase();
        if (normalized === 'true' || normalized === 'false') return normalized;
        throw new Error(`${key} must be true or false`);
    }

    if (schema.type === 'number') {
        const number = Number(value);
        if (!Number.isInteger(number)) throw new Error(`${key} must be an integer`);
        if (schema.min !== undefined && number < schema.min) throw new Error(`${key} must be at least ${schema.min}`);
        if (schema.max !== undefined && number > schema.max) throw new Error(`${key} must be at most ${schema.max}`);
        return String(number);
    }

    if (schema.type === 'enum') {
        const normalized = String(value).trim().toUpperCase();
        if (!schema.values.includes(normalized)) {
            throw new Error(`${key} must be one of: ${schema.values.join(', ')}`);
        }
        return normalized;
    }

    return String(value);
};

const validateConfigUpdate = (input, options = {}) => {
    const { existingConfig = {}, skipEmptySecrets = true } = options;
    const values = {};
    const errors = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return { values, errors: ['Invalid configuration format'] };
    }

    Object.entries(input).forEach(([key, value]) => {
        const schema = CONFIG_SCHEMA[key];

        if (!schema || !schema.adminEditable) {
            errors.push(`Unknown configuration key: ${key}`);
            return;
        }

        if (schema.secret && skipEmptySecrets && isEmpty(value)) {
            return;
        }

        try {
            values[key] = normalizeValue(key, value);
        } catch (err) {
            errors.push(err.message);
        }
    });

    const merged = applyDefaults({ ...existingConfig, ...values });

    Object.entries(CONFIG_SCHEMA).forEach(([key, schema]) => {
        if (schema.requiredWhen && schema.requiredWhen(merged) && isEmpty(merged[key])) {
            errors.push(`${key} is required when STORAGE_TYPE is ${merged.STORAGE_TYPE}`);
        }
    });

    return { values, errors };
};

module.exports = {
    CONFIG_SCHEMA,
    DEFAULT_BRANDING,
    SECRET_PLACEHOLDER,
    applyDefaults,
    maskSecrets,
    rowsToConfig,
    validateConfigUpdate
};
