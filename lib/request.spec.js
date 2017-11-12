'use strict';

const SuiteRequest = require('./request');
const request = require('request-promise-native');
const Escher = require('escher-auth');

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
      body: 'response body dummy'
    };
  };

  let requestOptions;

  beforeEach(function() {
    requestOptions = new SuiteRequest.Options(serviceConfig.host, serviceConfig);
  });

  it('should sign headers of GET request', function() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get').resolves(createDummyResponse());

    suiteRequest.get('/path');

    const requestArgument = request.get.getCall(0).args[0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers of POST request', function() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = request.post.getCall(0).args[0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it.only('should return response body', function*() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    const result = yield suiteRequest.post('/path', { name: 'Almanach' });

    expect(result.body).to.eql('response body dummy');
  });

  it('should sign headers of DELETE request', function() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'delete').resolves(createDummyResponse());

    suiteRequest.delete('/path');

    const requestArgument = request.delete.getCall(0).args[0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('SignedHeaders=content-type;host;x-ems-date,');
  });

  it('should sign headers with non string values', function() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['x-customer-id', 15]);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = request.post.getCall(0).args[0];
    expect(requestArgument.headers['x-ems-auth']).to.have.string('content-type;host;x-customer-id;x-ems-date,');
  });

  it('should encode payload when content type is json', function*() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = request.post.getCall(0).args[0];
    expect(requestArgument.body).to.eql('{"name":"Almanach"}');
  });

  it('should encode payload when content type is utf8 json', function*() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['content-type', 'application/json;charset=utf-8']);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    yield suiteRequest.post('/path', { name: 'Almanach' });

    const requestArgument = request.post.getCall(0).args[0];
    expect(requestArgument.body).to.eql('{"name":"Almanach"}');
  });

  it('should skip encoding of payload when content type is not json', function*() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    requestOptions.setHeader(['content-type', 'text/csv']);

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    yield suiteRequest.post('/path', 'header1;header2');

    const requestArgument = request.post.getCall(0).args[0];
    expect(requestArgument.body).to.eql('header1;header2');
  });

  it('signs extra headers too', function*() {
    requestOptions.setHeader(['extra-header', 'header-value']);
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);

    this.sandbox.stub(request, 'get').resolves(createDummyResponse());

    yield suiteRequest.get('/path');

    const requestArgument = request.get.getCall(0).args[0];
    expect(requestArgument.headers['x-ems-auth'])
      .to.have.string('SignedHeaders=content-type;extra-header;host;x-ems-date,');
  });

  it('should sign the payload of POST request', function*() {
    const suiteRequest = SuiteRequest.create('key-id', 'secret', requestOptions);
    const payload = { name: 'Test' };
    this.sandbox.spy(Escher.prototype, 'signRequest');

    this.sandbox.stub(request, 'post').resolves(createDummyResponse());

    yield suiteRequest.post('/path', payload);

    expect(Escher.prototype.signRequest.callCount).to.eql(1);
    const firstCall = Escher.prototype.signRequest.getCall(0);
    expect(firstCall.args[1]).to.eql(JSON.stringify(payload));
  });
});
