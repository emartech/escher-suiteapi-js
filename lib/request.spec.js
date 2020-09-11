'use strict';

const SuiteRequest = require('./request');
const axios = require('axios');
const Escher = require('escher-auth');
const http = require('http');
const https = require('https');

describe('SuiteRequest', function() {
  const serviceConfig = {
    host: 'localhost',
    port: 1234,
    prefix: '/api',
    rejectUnauthorized: false,
    secure: true,
    credentialScope: 'eu/dummy/ems_request'
  };

  const createDummyResponse = function() {
    return {
      headers: {},
      data: 'response body dummy'
    };
  };

  let requestOptions;
  let requestStub;
  let suiteRequest;

  beforeEach(function() {
    requestOptions = new SuiteRequest.Options(serviceConfig.host, serviceConfig);
    requestStub = this.sandbox.stub(axios, 'request').resolves(createDummyResponse());
    suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
  });

  it('should sign headers of GET request', function*() {
    yield suiteRequest.get('/path');

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers of PATCH request', function*() {
    yield suiteRequest.patch('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers of POST request', function*() {
    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers of DELETE request', function*() {
    yield suiteRequest.delete('/path');

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers with non string values', function*() {
    requestOptions.setHeader(['x-customer-id', 15]);

    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('content-type;host;x-customer-id;x-ems-date,');
  });

  it('should encode payload when content type is json', function*() {
    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.data).to.eql('{"name":"Almanach"}');
  });

  it('should encode payload when content type is json and method is GET', function*() {
    yield suiteRequest.get('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.data).to.eql('{"name":"Almanach"}');
  });

  it('should encode payload when content type is utf8 json', function*() {
    requestOptions.setHeader(['content-type', 'application/json;charset=utf-8']);

    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.data).to.eql('{"name":"Almanach"}');
  });

  it('should skip encoding of payload when content type is not json', function*() {
    requestOptions.setHeader(['content-type', 'text/csv']);

    yield suiteRequest.post('/path', 'header1;header2');

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.data).to.eql('header1;header2');
  });

  it('signs extra headers too', function*() {
    requestOptions.setHeader(['extra-header', 'header-value']);

    yield suiteRequest.get('/path');

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.headers['x-ems-auth'])
      .to.have.string('SignedHeaders=content-type;extra-header;host;x-ems-date,');
  });

  it('should pass down parameters to request call from request options', function*() {
    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];

    expect(requestArgument).to.contain({
      method: 'post',
      url: 'https://localhost:1234/api/path',
      data: '{"name":"Almanach"}',
      timeout: 15000,
      maxContentLength: 10485760
    });
  });

  it('should sign the payload of PATCH request', function*() {
    const payload = { name: 'Test' };
    this.sandbox.spy(Escher.prototype, 'signRequest');

    yield suiteRequest.patch('/path', payload);

    expect(Escher.prototype.signRequest.callCount).to.eql(1);
    const firstCall = Escher.prototype.signRequest.getCall(0);
    expect(firstCall.args[1]).to.eql(JSON.stringify(payload));
  });

  it('should sign the payload of POST request', function*() {
    const payload = { name: 'Test' };
    this.sandbox.spy(Escher.prototype, 'signRequest');

    yield suiteRequest.post('/path', payload);

    expect(Escher.prototype.signRequest.callCount).to.eql(1);
    const firstCall = Escher.prototype.signRequest.getCall(0);
    expect(firstCall.args[1]).to.eql(JSON.stringify(payload));
  });

  it('should sign the payload of GET request', function*() {
    const payload = { name: 'Test' };
    this.sandbox.spy(Escher.prototype, 'signRequest');

    yield suiteRequest.get('/path', payload);

    expect(Escher.prototype.signRequest.callCount).to.eql(1);
    const firstCall = Escher.prototype.signRequest.getCall(0);
    expect(firstCall.args[1]).to.eql(JSON.stringify(payload));
  });

  it('should not create http agents by default', function() {
    suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    expect(suiteRequest.httpAgent).to.be.undefined;
    expect(suiteRequest.httpsAgent).to.be.undefined;
  });

  it('should create http agents when connection is keep alive', function() {
    requestOptions = new SuiteRequest.Options(serviceConfig.host, Object.assign({ keepAlive: true }, serviceConfig));

    suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    expect(suiteRequest.httpAgent).to.be.an.instanceOf(http.Agent);
    expect(suiteRequest.httpsAgent).to.be.an.instanceOf(https.Agent);
  });

  it('should pass http agents to wrapper', function*() {
    requestOptions = new SuiteRequest.Options(serviceConfig.host, Object.assign({ keepAlive: true }, serviceConfig));
    suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = requestStub.args[0][0];
    expect(requestArgument.httpAgent).to.eql(suiteRequest.httpAgent);
    expect(requestArgument.httpsAgent).to.eql(suiteRequest.httpsAgent);
  });
});
