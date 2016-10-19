const loggerCreator = require('./../lib');
const express = require('express');
const request = require('supertest');

describe('loggerCreator(logger, options)', function () {
  it('returns a function', function () {
    const logger = {
      info: () => {},
      warn: () => {},
      error: () => {},
    };
    const middleware = loggerCreator(logger);
    expect(middleware).to.be.a('function');
  });
  it('throws if no logger', function () {
    expect(function throwError() {
      loggerCreator();
    }).to.throw();
  });
  it('throws if logger has no `.info`', function () {
    expect(function testThrow() {
      const logger = {
        warn: () => {},
        error: () => {},
      };
      loggerCreator(logger);
    }).to.throw();
  });
  it('throws if logger has no `.warn`', function () {
    expect(function testThrow() {
      const logger = {
        info: () => {},
        error: () => {},
      };
      loggerCreator(logger);
    }).to.throw();
  });
  it('throws if logger has no `.error`', function () {
    expect(function testThrow() {
      const logger = {
        warn: () => {},
        info: () => {},
      };
      loggerCreator(logger);
    }).to.throw();
  });
  describe('when mounted to express', function () {
    before(function () {
      const app = express();
      const logger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
      };
      this.logger = logger;
      const loggerMiddleware = loggerCreator(logger, {
        headers: ['x-test-header'],
      });
      app.use(loggerMiddleware);
      app.get('/log', function (req, res) {
        req.logs['test.req.log'] = 'testlog';
        res.status(200).json({ name: 'tobi' });
      });
      app.get('/not_found', function (req, res) {
        res.status(404).json({ name: 'not found' });
      });
      app.post('/error', function (req, res) {
        res.status(500).json({ name: 'tobi' });
      });
      app.get('/res_logs', function (req, res) {
        res.logs.err = new Error('asdfasdfadfsasdf');
        res.status(200).json({ name: 'ok' });
      });
      this.app = app;
    });
    afterEach(function () {
      this.logger.info.reset();
      this.logger.warn.reset();
      this.logger.error.reset();
    });
    it('should call logger for request', function (done) {
      request(this.app)
        .get('/log')
        .set('x-test-header', 'lol')
        .query({ token: 't' })
        .expect(200)
        .end((err) => {
          if (err) {
            return done(err);
          }
          this.logger.info.should.have.been.callCount(1);
          const logObj = this.logger.info.args[0][0];
          // console.log(JSON.stringify(logObj, null, 2));
          logObj.should.have.property('req_id');
          logObj.should.have.property('statusCode', 200);
          logObj.should.have.property('method', 'GET');
          logObj.should.have.property('url', '/log?token=t');
          logObj.should.have.property('path', '/log');
          logObj.should.have.property('originalUrl');
          logObj.should.have.property('ip');
          logObj.should.have.property('response_time');
          logObj.should.have.property('http_version');
          logObj.should.have.property('req_headers')
            .that.has.property('x-test-header', 'lol');
          logObj.should.have.property('logs')
            .that.has.property('test.req.log', 'testlog');
          return done();
        });
    });
    it('call `.warn` for 4xx', function (done) {
      request(this.app)
        .get('/not_found')
        .set('x-test-header', 'lol')
        .query({ token: 't' })
        .expect(404)
        .end((err) => {
          if (err) {
            return done(err);
          }
          this.logger.warn.should.have.been.callCount(1);
          const logObj = this.logger.warn.args[0][0];
          logObj.should.have.property('req_id');
          logObj.should.have.property('statusCode', 404);
          logObj.should.have.property('method', 'GET');
          logObj.should.have.property('url', '/not_found?token=t');
          logObj.should.have.property('path', '/not_found');
          logObj.should.have.property('originalUrl');
          logObj.should.have.property('ip');
          logObj.should.have.property('response_time');
          logObj.should.have.property('http_version');
          logObj.should.have.property('req_headers')
            .that.has.property('x-test-header', 'lol');

          return done();
        });
    });
    it('call `.error` for 5xx', function (done) {
      request(this.app)
        .post('/error')
        .set('x-test-header', 'lol')
        .query({ token: 't' })
        .expect(500)
        .end((err) => {
          if (err) {
            return done(err);
          }
          this.logger.error.should.have.been.callCount(1);
          const logObj = this.logger.error.args[0][0];
          logObj.should.have.property('req_id');
          logObj.should.have.property('statusCode', 500);
          logObj.should.have.property('method', 'POST');
          logObj.should.have.property('url', '/error?token=t');
          logObj.should.have.property('path', '/error');
          logObj.should.have.property('originalUrl');
          logObj.should.have.property('ip');
          logObj.should.have.property('response_time');
          logObj.should.have.property('http_version');
          logObj.should.have.property('req_headers')
            .that.has.property('x-test-header', 'lol');
          logObj.req_headers.should.have.property('user-agent');

          return done();
        });
    });
    it('takes `res_logs`', function (done) {
      request(this.app)
        .get('/res_logs')
        .set('x-test-header', 'lol')
        .query({ token: 't' })
        .expect(200)
        .end((err) => {
          if (err) {
            return done(err);
          }
          this.logger.info.should.have.been.callCount(1);
          const logObj = this.logger.info.args[0][0];
          logObj.should.have.property('req_id');
          logObj.should.have.property('statusCode', 200);
          logObj.should.have.property('method', 'GET');
          logObj.should.have.property('url', '/res_logs?token=t');
          logObj.should.have.property('path', '/res_logs');
          logObj.should.have.property('originalUrl');
          logObj.should.have.property('ip');
          logObj.should.have.property('response_time');
          logObj.should.have.property('http_version');
          logObj.should.have.property('req_headers')
            .that.has.property('x-test-header', 'lol');
          logObj.req_headers.should.have.property('user-agent');
          logObj.should.have.property('res_logs')
            .that.has.property('err');
          logObj.res_logs.err.should.have.property('message', 'asdfasdfadfsasdf');
          return done();
        });
    });
  });
});
