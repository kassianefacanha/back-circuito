require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRE: '24h',
  ADMIN_EMAILS: ['admin@example.com', 'dev@example.com']
};