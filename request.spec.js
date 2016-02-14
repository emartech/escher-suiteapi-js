'use strict';

var SuiteRequest = require('./request');
var request = require('request');
var expect = require('chai').expect;

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

  it('signs headers of the request', function() {
    var requestOptions = new SuiteRequest.Options(serviceConfig.host, serviceConfig);
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.get('/path');
  });

  it('signs extra headers too', function() {
    var requestOptions = new SuiteRequest.Options(serviceConfig.host, serviceConfig);
    requestOptions.addHeader(['extra-header', 'header-value']);
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;extra-header;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.get('/path');
  });

});
