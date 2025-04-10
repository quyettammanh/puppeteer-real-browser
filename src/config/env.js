/**
 * Environment configuration module
 * This module centralizes all environment variable access
 */
require('dotenv').config();

module.exports = {
  // Browser settings
  browser: {
    hiddenChrome: process.env.HIDDEN_CHROME || '',
  },
  
  // Redis settings
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    registerChannel: process.env.REDIS_REGISTER_CHANNEL || 'url_updates',
  },
  
  // Telegram notification settings
  telegram: {
    botToken: process.env.BOT_TOKEN || '',
    chatId: process.env.CHAT_ID || '',
  },
  
  // Initial registration url for testing
  initial: {
    registerUrl: process.env.INITIAL_REGISTER_URL || '',
    exam: process.env.INITIAL_EXAM || 'hcm_b2-link1',
    modules: process.env.INITIAL_MODULES || 'Reading-Listening-Writing-Speaking',
    date: process.env.INITIAL_DATE || new Date().toLocaleDateString('en-GB'),
  },
}; 