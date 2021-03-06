const fp = require('lodash/fp');
const uuid = require('node-uuid');
// const debug = require('debug')('bunyan-express:lib');

function getRequestId(req) {
  const id = uuid.v1();
  req.id = id;
  return {
    req_id: id,
  };
}

const getStatusCode = fp.pick(['statusCode']);
const getMethod = fp.pick(['method']);
const getUrls = fp.pick(['url', 'originalUrl']);
const getReqIp = fp.pick(['ip']);
const getReqLogs = fp.pick(['logs']);
function getResLogs(res) {
  return {
    res_logs: res.logs,
  };
}

function getReqQuery(req) {
  return {
    req_query: fp.pick(['query'])(req),
  };
}
// const getReqParams = fp.pick(['params']);
const getReqPath = fp.pick(['path']);

function getReqHttpVersion(req) {
  return {
    http_version: `${req.httpVersionMajor}.${req.httpVersionMinor}`,
  };
}

function getResTime(startTime) {
  const hrtime = process.hrtime(startTime);
  const responseTime = (hrtime[0] * 1e3) + (hrtime[1] / 1e6);
  return {
    response_time: responseTime,
  };
}

const BASIC_HEADER_FIELDS = [
  'referer',
  'user-agent',
];

function getHeaderFields(fields) {
  return function getHeaderFieldsForReq(req) {
    return fp.reduce((result, field) => {
      result[field] = req.get(field);
      return result;
    })({})(fields);
  };
}
const getBasicReqHeaders = getHeaderFields(BASIC_HEADER_FIELDS);

function defaultLevelFn(statusCode) {
  if (statusCode >= 500) { // server internal error or error
    return 'error';
  } else if (statusCode >= 400) { // client error
    return 'warn';
  }
  return 'info';
}

/**
 * [loggerCreator description]
 * @param  {[type]} logger  [description]
 * @param  {object} options [description]
 * @param  {[string]} options.headers header names to extract
 * @return {[type]}         [description]
 */
function loggerCreator(logger, options) {
  // debug('loggerCreator', options);
  if (!logger || !logger.error || !logger.warn || !logger.info) {
    throw new Error('logger, logger.error, logger.warn and logger.info are required');
  }
  const pOptions = fp.clone(options || {});
  const getExtraReqHeaders = getHeaderFields(pOptions.headers || []);
  return function bunyanMiddleware(req, res, next) {
    // debug('bunyanMiddleware', req.url);
    // attach the logger to req
    req.logger = logger;
    const startTime = process.hrtime();
    const logs = Object.assign({}, getRequestId(req));
    req.logs = {};
    res.logs = {};
    function logging() {
      // debug('bunyanMiddleware', 'logging', logs.req_id);
      const resLog = Object.assign(
        {},
        logs,
        getStatusCode(res),
        getMethod(req),
        getUrls(req),
        getReqIp(req),
        getResTime(startTime),
        getReqHttpVersion(req),
        { req_headers: Object.assign(
          {}, getExtraReqHeaders(req), getBasicReqHeaders(req)) },
        getReqQuery(req),
        // getReqParams(req),
        getReqPath(req),
        getReqLogs(req),
        getResLogs(res)
      );

      const logLevel = defaultLevelFn(resLog.statusCode);
      const logFn = logger[logLevel];
      logFn.call(logger, resLog);
    }
    res.once('finish', logging);
    res.once('close', logging);
    next();
  };
}

module.exports = loggerCreator;
