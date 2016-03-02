'use strict';

var request = require('request');
var Wrapper = require('./wrapper');
var SuiteRequestError = require('./requestError');

describe('Wrapper', function() {
  var apiRespone;
  var protocol = 'http:';
  var escherRequestOptions = {
    port: 443,
    host: 'very.host.io',
    headers: [
      ['content-type', 'very-format'],
      ['x-custom', 'alma']
    ],
    method: 'GET',
    path: '/purchases/1/content'
  };

  var requestOptions = {
    uri: {
      hostname: escherRequestOptions.host,
      port: escherRequestOptions.port,
      protocol: 'http:',
      pathname: escherRequestOptions.path
    },
    headers: {
      'content-type': 'very-format',
      'x-custom': 'alma'
    },
    timeout: 15000
  };

  beforeEach(function() {
    apiRespone = {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        data: 1
      })
    };
  });

  it('should send GET request and return its response', function *() {
    var requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
      callback(null, apiRespone);
    });

    var wrapper = new Wrapper(escherRequestOptions, protocol);

    var response = yield wrapper.send();
    expect(response).to.be.eql(apiRespone);
    expect(requestGetStub).to.be.calledWith(requestOptions);
  });

  it('should throw error when response code is 400 or above', function *() {
    apiRespone.statusCode = 400;
    apiRespone.body = JSON.stringify({
      replyText: 'Unknown route'
    });

    var requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
      callback(null, apiRespone);
    });

    var wrapper = new Wrapper(escherRequestOptions, protocol);

    try {
      yield wrapper.send();
      throw new Error('Error should have been thrown');
    } catch (err) {
      expect(err).to.be.an.instanceof(SuiteRequestError);
      expect(err).to.be.eql({
        message: 'Error in http response (status: 400)',
        name: 'SuiteRequestError',
        code: 400,
        data: {
          replyText: 'Error in http response (status: 400)'
        },
        replyText: 'Unknown route'
      });
      expect(requestGetStub).to.be.calledWith(requestOptions);
    }
  });

  it('should throw error when response body is empty', function *() {
    apiRespone.body = '';

    var requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
      callback(null, apiRespone);
    });

    var wrapper = new Wrapper(escherRequestOptions, protocol);

    try {
      yield wrapper.send();
      throw new Error('Error should have been thrown');
    } catch (err) {
      expect(err).to.be.an.instanceof(SuiteRequestError);
      expect(err).to.be.eql({
        message: 'Empty http response',
        name: 'SuiteRequestError',
        code: 500,
        data: {
          replyText: 'Empty http response'
        }
      });
      expect(requestGetStub).to.be.calledWith(requestOptions);
    }
  });
});
