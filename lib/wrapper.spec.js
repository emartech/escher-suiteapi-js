'use strict';

const axios = require('axios');
const Wrapper = require('./wrapper');
const SuiteRequestError = require('./requestError');
const RequestOption = require('./requestOption');

describe('Wrapper', function() {
  let apiResponse;
  let expectedApiResponse;
  let escherRequestOptions;
  let expectedRequestOptions;

  beforeEach(function() {
    apiResponse = {
      headers: { 'content-type': 'application/json' },
      data: JSON.stringify({ data: 1 }),
      status: 200,
      statusText: 'OK'
    };

    expectedApiResponse = {
      headers: { 'content-type': 'application/json' },
      body: { data: 1 },
      statusCode: 200,
      statusMessage: 'OK'
    };

    escherRequestOptions = new RequestOption('very.host.io', {
      port: 443,
      headers: [
        ['content-type', 'very-format'],
        ['x-custom', 'alma']
      ],
      method: 'GET',
      path: '/purchases/1/content'
    });

    expectedRequestOptions = {
      method: 'get',
      url: 'http://very.host.io:443/purchases/1/content',
      data: undefined,
      headers: {
        'content-type': 'very-format',
        'x-custom': 'alma'
      },
      timeout: 15000,
      maxContentLength: 10485760,
      cancelToken: 'source-token'
    };
  });

  describe('request handling', function() {
    let wrapper;
    let requestGetStub;
    let source;

    beforeEach(function() {
      requestGetStub = this.sandbox.stub(axios, 'request');
      requestGetStub.resolves(apiResponse);
      source = {
        token: 'source-token',
        cancel: this.sandbox.stub()
      };
      this.sandbox.stub(axios.CancelToken, 'source').returns(source);

      wrapper = new Wrapper(escherRequestOptions, 'http:');
    });

    it('should send GET request and return its response', function *() {
      const response = yield wrapper.send();

      expect(response).to.be.eql(expectedApiResponse);
      const requestArgument = requestGetStub.args[0][0];
      expect(requestArgument).to.containSubset(expectedRequestOptions);
    });

    it('should throw error when response code is 400 or above', function *() {
      apiResponse.status = 400;
      apiResponse.data = JSON.stringify({ replyText: 'Unknown route' });

      try {
        yield wrapper.send();
        throw new Error('Error should have been thrown');
      } catch (err) {
        expect(err).to.be.an.instanceof(SuiteRequestError);
        expect(err.message).to.eql('Error in http response (status: 400)');
        expect(err.code).to.eql(400);
        expect(err.data).to.eql({ replyText: 'Unknown route' });
      }
    });

    describe('when empty response is allowed', function() {
      beforeEach(function() {
        escherRequestOptions.allowEmptyResponse = true;
        wrapper = new Wrapper(escherRequestOptions, 'http:');
      });


      it('should allow body to be empty', function *() {
        apiResponse.headers['content-type'] = 'text/html';
        apiResponse.data = '';
        apiResponse.status = 204;

        const response = yield wrapper.send();

        expect(response.statusCode).to.eql(204);
      });


      it('should throw error if json is not parsable (empty)', function *() {
        apiResponse.data = '';

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
        apiResponse.data = '';

        try {
          yield wrapper.send();
        } catch (err) {
          expect(err).to.be.an.instanceof(SuiteRequestError);
          expect(err.message).to.eql('Empty http response');
          expect(err.code).to.eql(500);
          expect(err.data).to.eql(expectedApiResponse.statusMessage);
          return;
        }
        throw new Error('Error should have been thrown');
      });

      it('should throw error with status message if response body is empty and status message exists', function *() {
        apiResponse.data = '';
        apiResponse.statusText = 'dummy status message';

        try {
          yield wrapper.send();
        } catch (err) {
          expect(err.data).to.eql(apiResponse.statusText);
          return;
        }
        throw new Error('Error should have been thrown');
      });

      it('should throw a http response error even if the response body is empty', function *() {
        apiResponse.data = '404 Not Found';
        apiResponse.status = 404;
        apiResponse.headers = { 'content-type': 'text/plain' };

        try {
          yield wrapper.send();
          throw new Error('should throw');
        } catch (err) {
          expect(err).to.be.an.instanceOf(SuiteRequestError);
          expect(err.code).to.eql(apiResponse.status);
          expect(err.message).to.eql('Error in http response (status: 404)');
          expect(err.data).to.eql(apiResponse.data);
        }
      });
    });

    describe('when there was an axios error', function() {
      let isCancel;

      beforeEach(function() {
        const axiosError = {
          message: 'axios error message',
          stack: []
        };
        isCancel = this.sandbox.stub(axios, 'isCancel');
        requestGetStub.rejects(axiosError);
      });

      context('when the request has not been canceled', function() {
        beforeEach(function() {
          isCancel.returns(false);
        });

        it('cancels the request', function *() {
          try {
            yield wrapper.send();
            throw new Error('should throw SuiteRequestError');
          } catch (err) {
            expect(source.cancel).to.have.been.calledWith();
          }
        });
      });

      context('when the request has already been canceled', function() {
        beforeEach(function() {
          isCancel.returns(true);
        });

        it('cancels the request', function *() {
          try {
            yield wrapper.send();
            throw new Error('should throw SuiteRequestError');
          } catch (err) {
            expect(source.cancel).not.to.have.been.calledWith();
          }
        });
      });

    });


    it('should throw error if json is not parsable (malformed)', function *() {
      apiResponse.data = 'this is an invalid json';

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
      apiResponse.data = JSON.stringify(testJson);

      const response = yield wrapper.send();

      expect(response.body).to.eql(testJson);
    });

    it('should send GET request with given timeout in options', function*() {
      escherRequestOptions.timeout = 60000;
      yield (new Wrapper(escherRequestOptions, 'http:')).send();

      const requestArgument = requestGetStub.args[0][0];
      expect(requestArgument.timeout).to.eql(escherRequestOptions.timeout);
    });
  });
});
