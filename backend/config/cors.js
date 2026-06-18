const parseOrigins = (value) => (
    String(value || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
);

const getCorsOptions = (env = process.env) => {
    const allowedOrigins = parseOrigins(env.CORS_ORIGIN);

    if (allowedOrigins.length === 0) {
        return {};
    }

    return {
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
    };
};

module.exports = {
    getCorsOptions,
    parseOrigins
};
