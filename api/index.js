const serverless = require('serverless-http');
const app = require('../index'); // This imports your existing Express app

module.exports.handler = serverless(app);
