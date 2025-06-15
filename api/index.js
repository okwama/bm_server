const serverless = require('serverless-http');
const app = require('../app'); // This imports your existing Express app

module.exports.handler = serverless(app);
