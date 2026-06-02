const pino = require('pino');
const pinoHttp = require('pino-http');
const { AsyncLocalStorage } = require('async_hooks');

const serviceName = process.env.SERVICE_NAME || 'nova-rewards-backend';
const level = process.env.LOG_LEVEL || 'info';

const asyncLocalStorage = new AsyncLocalStorage();

const baseLogger = pino({
  level,
  base: { service: serviceName },
  timestamp: pino.stdTimeFunctions.isoTime,
});

function getLogger() {
  return baseLogger;
}

function getCorrelationId() {
  const store = asyncLocalStorage.getStore();
  return store && store.correlationId;
}

function pinoMiddleware() {
  return pinoHttp({
    logger: baseLogger,
    genReqId: (req) => {
      // Prefer existing headers, fallback to generated id
      return req.headers['x-correlation-id'] || req.headers['x-trace-id'] || undefined;
    },
    customLogLevel: function (res, err) {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customProps: function (req, res) {
      return { correlationId: req.correlationId || req.id };
    },
  });
}

module.exports = { getLogger, pinoMiddleware, asyncLocalStorage, getCorrelationId };
