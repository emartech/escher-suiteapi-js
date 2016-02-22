'use strict';

var SuiteRequest = require('./request');
var request = require('request');

describe('SuiteRequest', function() {
  var serviceConfig = {
    host: 'localhost',
    port: 1234,
    prefix: '/api',
    rejectUnauthorized: false,
    secure: true,
    credentialScope: 'eu/dummy/ems_request'
  };

  var createDummyResponse = function() {
    return {
      headers: {},
      body: 'response body dummy'
    };
  };

  var requestOptions;

  beforeEach(function() {
    requestOptions = new SuiteRequest.Options(serviceConfig.host, serviceConfig);
  });

  it('should sign headers of GET request', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.get('/path');
  });

  it('should sign headers of POST request', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'post', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.post('/path', { name: 'Almanach' });
  });

  it('should sign headers with non string values', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['x-customer-id', 15]);

    this.sandbox.stub(request, 'post', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('content-type;host;x-customer-id;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.post('/path', { name: 'Almanach' });
  });

  it('signs extra headers too', function() {
    requestOptions.setHeader(['extra-header', 'header-value']);
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;extra-header;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.get('/path');
  });
});
