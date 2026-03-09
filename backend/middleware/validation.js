const { body, param, validationResult } = require('express-validator');

exports.body = body;

// Generic helper to handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(400).json({ errors: errors.array() });
};

exports.validate = validate;

// Repair Validation
exports.repairValidation = [
    body('vfd_id').isInt().withMessage('VFD ID must be an integer'),
    body('type').isIn(['Quote', 'Approval']).withMessage('Type must be Quote or Approval'),
    body('age').optional({ checkFalsy: true }).isString(),
    body('run_hours').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Run hours must be an integer'),
    body('connection_hours').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Connection hours must be an integer'),
    validate
];

exports.repairUpdateValidation = [
    body('vfd_id').optional().isInt(),
    body('run_hours').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Run hours must be an integer'),
    body('connection_hours').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Connection hours must be an integer'),
    body('age').optional({ checkFalsy: true }).isString(),
    body('status').optional().isString(),
    validate
];

// Client Validation
exports.clientValidation = [
    body('name').notEmpty().trim().isLength({ max: 255 }).withMessage('Client name is required'),
    body('contact_info').optional({ checkFalsy: true }).isString(),
    validate
];

// VFD Validation
exports.vfdValidation = [
    body('serial_number').notEmpty().trim().isLength({ max: 100 }).withMessage('Serial number is required'),
    body('internal_number').optional({ checkFalsy: true }).isInt().withMessage('Internal number must be an integer'),
    body('client_id').isInt().withMessage('Client ID must be an integer'),
    body('model_id').isInt().withMessage('Model ID must be an integer'),
    validate
];

// Auth Validation
exports.registerValidation = [
    body('username').notEmpty().trim().isLength({ min: 3 }),
    body('password').isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'technician']),
    validate
];

exports.loginValidation = [
    body('username').notEmpty(),
    body('password').notEmpty(),
    validate
];
