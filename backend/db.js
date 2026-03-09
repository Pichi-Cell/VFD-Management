const { Pool } = require('pg');
require('dotenv').config();

const pool = global.testPool || new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = {
  query: (text, params) => (global.testPool || pool).query(text, params),
  checkConnection: async () => {
    const p = global.testPool || pool;
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
    } finally {
      client.release();
    }
  },
};
