'use strict';

const request = require('request-promise-native');
const Wrapper = require('./wrapper');
const SuiteRequestError = require('./requestError');

describe('Wrapper', function() {
  let apiResponse;
  let escherRequestOptions;
  let expectedRequestOptions;

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
    let wrapper;
    let requestGetStub;

    beforeEach(function() {
      requestGetStub = this.sandbox.stub(request, 'get').resolves(apiResponse);
      wrapper = new Wrapper(escherRequestOptions, 'http:');
    });

    it('should send GET request and return its response', function *() {
      const response = yield wrapper.send();
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

    describe('when empty response is allowed', function() {
      beforeEach(function() {
        escherRequestOptions.allowEmptyResponse = true;
        wrapper = new Wrapper(escherRequestOptions, 'http:');
      });


      it('should allow body to be empty', function *() {
        apiResponse.headers['content-type'] = 'text/html';
        apiResponse.body = '';
        apiResponse.statusCode = 204;

        const response = yield wrapper.send();

        expect(response.statusCode).to.eql(204);
      });


      it('should throw error if json is not parsable (empty)', function *() {
        apiResponse.body = '';

        try {
          yield wrapper.send();
        } catch (err) {
          expect(err).to.be.an.instanceof(SuiteRequestError);
          expect(err.message).to.match(/Unexpected end/);
          expect(err.code).to.eql(500);
          return;
        }
        throw new Error('Error should have been thrown');
      });
    });

    describe('when empty response is not allowed', function() {
      it('should throw error if response body is empty', function *() {
        apiResponse.body = '';

        try {
          yield wrapper.send();
        } catch (err) {
          expect(err).to.be.an.instanceof(SuiteRequestError);
          expect(err.message).to.eql('Empty http response');
          expect(err.code).to.eql(500);
          expect(err.data).to.eql({ replyText: 'Empty http response' });
          return;
        }
        throw new Error('Error should have been thrown');
      });

      it('should throw error with status message if response body is empty and status message exists', function *() {
        apiResponse.body = '';
        apiResponse.statusMessage = 'dummy status message';

        try {
          yield wrapper.send();
        } catch (err) {
          expect(err.data).to.eql(apiResponse.statusMessage);
          return;
        }
        throw new Error('Error should have been thrown');
      });
    });


    it('should throw error if json is not parsable (malformed)', function *() {
      apiResponse.body = 'this is an invalid json';

      try {
        yield wrapper.send();
      } catch (err) {
        expect(err).to.be.an.instanceof(SuiteRequestError);
        expect(err.message).to.match(/Unexpected token/);
        expect(err.code).to.eql(500);
        return;
      }
      throw new Error('Error should have been thrown');
    });

    it('should parse JSON if content-type header contains charset too', function *() {
      const testJson = { text: 'Test JSON text' };
      apiResponse.headers['content-type'] = 'application/json; charset=utf-8';
      apiResponse.body = JSON.stringify(testJson);

      const response = yield wrapper.send();

      expect(response.body).to.eql(testJson);
    });
  });


  describe('timeout', function() {
    it('should send GET request with given timeout in options', function*() {
      escherRequestOptions = Object.assign({}, escherRequestOptions, { timeout: 60000 });

      this.sandbox.stub(request, 'get').resolves(apiResponse);

      yield (new Wrapper(escherRequestOptions, 'http:')).send();

      const requestArgument = request.get.getCall(0).args[0];
      expect(requestArgument.timeout).to.be.eql(60000);
    });
  });
});
