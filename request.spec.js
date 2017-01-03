'use strict';

var SuiteRequest = require('./request');
var request = require('request');
var Escher = require('escher-auth');

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

  it('should sign headers of DELETE request', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'delete', function(options, callback) {
      expect(options.headers['x-ems-auth'])
        .to.have.string('SignedHeaders=content-type;host;x-ems-date,');
      callback(null, createDummyResponse());
    });

    suiteRequest.delete('/path');
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

  it('should encode payload when content type is json', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    this.sandbox.stub(request, 'post', function(options, callback) {
      try {
        expect(options.body).to.eql('{"name":"Almanach"}');
        callback(null, createDummyResponse());
      } catch (e) {
        callback(e, createDummyResponse());
      }
    });

    return suiteRequest.post('/path', { name: 'Almanach' });
  });

  it('should encode payload when content type is utf8 json', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['content-type', 'application/json;charset=utf-8']);

    this.sandbox.stub(request, 'post', function(options, callback) {
      try {
        expect(options.body).to.eql('{"name":"Almanach"}');
        callback(null, createDummyResponse());
      } catch (e) {
        callback(e, createDummyResponse());
      }
    });

    return suiteRequest.post('/path', { name: 'Almanach' });
  });

  it('should skip encoding of payload when content type is not json', function() {
    var suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['content-type', 'text/csv']);

    this.sandbox.stub(request, 'post', function(options, callback) {
      try {
        expect(options.body).to.eql('header1;header2');
        callback(null, createDummyResponse());
      } catch (e) {
        callback(e, createDummyResponse());
      }
    });

    return suiteRequest.post('/path', 'header1;header2');
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

  it('should sign the payload of POST request', function() {
    let suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    let payload = { name: 'Test' };
    this.sandbox.spy(Escher.prototype, 'signRequest');

    this.sandbox.stub(request, 'post', function(options, callback) {
      callback(null, createDummyResponse());
    });

    suiteRequest.post('/path', payload);

    let parameters = [this.sandbox.match.any, JSON.stringify(payload), this.sandbox.match.any];
    expect(Escher.prototype.signRequest.calledWith(...parameters)).to.eql(true);
  });
});
