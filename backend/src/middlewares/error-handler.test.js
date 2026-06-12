const { errorHandler } = require('./error-handler');
const redact = require('../utils/redact');
const assert = require('assert');

// Mock Logger to capture output
const Logger = require('../utils/logger');
let lastLog = null;
Logger.prototype.error = (message, meta) => {
    lastLog = { message, meta };
};

const testErrorHandlerRedaction = () => {
    console.log('Testing error handler redaction...');

    const err = new Error('Test Error');
    err.statusCode = 400;

    const req = {
        url: '/api/test',
        method: 'POST',
        body: {
            username: 'jules',
            password: 'my-password',
            token: 'secret-token'
        },
        params: {},
        query: {}
    };

    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.body = data;
            return this;
        }
    };

    const next = () => {};

    errorHandler(err, req, res, next);

    assert.ok(lastLog, 'Error should have been logged');
    assert.strictEqual(lastLog.meta.body.username, 'jules');
    assert.strictEqual(lastLog.meta.body.password, '[REDACTED]');
    assert.strictEqual(lastLog.meta.body.token, '[REDACTED]');

    console.log('✅ Error handler correctly redacts req.body in logs');
};

try {
    testErrorHandlerRedaction();
} catch (error) {
    console.error('❌ Error handler redaction test failed:');
    console.error(error);
    process.exit(1);
}
