'use strict';

var request = require('request');
var Wrapper = require('./wrapper');
var SuiteRequestError = require('./requestError');

describe('Wrapper', function() {
  var apiResponse;
  var escherRequestOptions;
  var expectedRequestOptions;

  beforeEach(function() {
    apiResponse = {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: 1 })
    };

    escherRequestOptions = {
      port: 443,
      host: 'very.host.io',
      headers: [
        ['content-type', 'very-format'],
        ['x-custom', 'alma']
      ],
      method: 'GET',
      path: '/purchases/1/content',
      timeout: 15000
    };

    expectedRequestOptions = {
      uri: {
        hostname: 'very.host.io',
        port: 443,
        protocol: 'http:',
        pathname: '/purchases/1/content'
      },
      headers: {
        'content-type': 'very-format',
        'x-custom': 'alma'
      },
      timeout: 15000
    };
  });

  describe('request handling', function() {
    var wrapper;
    var requestGetStub;

    beforeEach(function() {
      requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
        callback(null, apiResponse);
      });
      wrapper = new Wrapper(escherRequestOptions, 'http:');
    });

    it('should send GET request and return its response', function *() {
      var response = yield wrapper.send();
      expect(response).to.be.eql(apiResponse);
      expect(requestGetStub).to.be.calledWith(expectedRequestOptions);
    });

    it('should throw error when response code is 400 or above', function *() {
      apiResponse.statusCode = 400;
      apiResponse.body = JSON.stringify({ replyText: 'Unknown route' });

      try {
        yield wrapper.send();
        throw new Error('Error should have been thrown');
      } catch (err) {
        expect(err).to.be.an.instanceof(SuiteRequestError);
        expect(err.message).to.eql('Error in http response (status: 400)');
        expect(err.code).to.eql(400);
        expect(requestGetStub).to.be.calledWith(expectedRequestOptions);
      }
    });

    it('should throw error when response body is empty', function *() {
      apiResponse.body = '';

      try {
        yield wrapper.send();
        throw new Error('Error should have been thrown');
      } catch (err) {
        expect(err).to.be.an.instanceof(SuiteRequestError);
        expect(err.message).to.eql('Empty http response');
        expect(err.code).to.eql(500);
        expect(requestGetStub).to.be.calledWith(expectedRequestOptions);
      }
    });

  });


  describe('timeout', function() {
    it('should send GET request with given timeout in options', function*() {
      var actualRequestOption;
      this.sandbox.stub(request, 'get', function(options, callback) {
        actualRequestOption = options;
        callback(null, apiResponse);
      });

      escherRequestOptions.timeout = 60000;
      yield (new Wrapper(escherRequestOptions, 'http:')).send();

      expect(actualRequestOption.timeout).to.be.eql(60000);
    });
  });
});
