require('dotenv').config();
const emailService = require('./services/emailService');

async function test() {
    console.log('Testing EmailService initialization...');
    await emailService.init();
    console.log('Config:', emailService.config);
    process.exit(0);
}

test();
