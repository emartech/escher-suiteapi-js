const axios = require('axios');
const http = require('http');
const https = require('https');
const sinon = require('sinon');
const { expect } = require('chai');
const { RequestWrapper } = require('./wrapper');
const { EscherRequestError } = require('./requestError');
const { EscherRequestOption } = require('./requestOption');

describe('RequestWrapper', function() {
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

    escherRequestOptions = new EscherRequestOption('very.host.io', {
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
      requestGetStub = sinon.stub(axios, 'request');
      requestGetStub.resolves(apiResponse);
      source = {
        token: 'source-token',
        cancel: sinon.stub()
      };
      sinon.stub(axios.CancelToken, 'source').returns(source);

      wrapper = new RequestWrapper(escherRequestOptions, 'http:');
    });

    it('should send GET request and return its response', async () => {
      const response = await wrapper.send();

      expect(response).to.be.eql(expectedApiResponse);
      const requestArgument = requestGetStub.args[0][0];
      expect(requestArgument).to.containSubset(expectedRequestOptions);
      expect(requestArgument).not.to.have.own.property('httpAgent');
      expect(requestArgument).not.to.have.own.property('httpsAgent');
    });

    it('should pass http agents to axios', async () => {
      const agents = {
        httpAgent: new http.Agent({ keepAlive: true }),
        httpsAgent: new https.Agent({ keepAlive: true })
      };
      wrapper = new RequestWrapper(
        Object.assign(agents, escherRequestOptions),
        'http:'
      );

      await wrapper.send();

      const requestArgument = requestGetStub.args[0][0];
      expect(requestArgument.httpAgent).to.eql(agents.httpAgent);
      expect(requestArgument.httpsAgent).to.eql(agents.httpsAgent);
    });

    it('should throw error when response code is 400 or above', async () => {
      apiResponse.status = 400;
      apiResponse.data = JSON.stringify({ replyText: 'Unknown route' });

      try {
        await wrapper.send();
        throw new Error('Error should have been thrown');
      } catch (err) {
        expect(err).to.be.an.instanceof(EscherRequestError);
        expect(err.message).to.eql('Error in http response (status: 400)');
        expect(err.code).to.eql(400);
        expect(err.data).to.eql({ replyText: 'Unknown route' });
      }
    });

    describe('when empty response is allowed', function() {
      beforeEach(function() {
        escherRequestOptions.allowEmptyResponse = true;
        wrapper = new RequestWrapper(escherRequestOptions, 'http:');
      });


      it('should allow body to be empty', async () => {
        apiResponse.headers['content-type'] = 'text/html';
        apiResponse.data = '';
        apiResponse.status = 204;

        const response = await wrapper.send();

        expect(response.statusCode).to.eql(204);
      });


      it('should throw error if json is not parsable (empty)', async () => {
        apiResponse.data = '';

        try {
          await wrapper.send();
        } catch (err) {
          expect(err).to.be.an.instanceof(EscherRequestError);
          expect(err.message).to.match(/Unexpected end/);
          expect(err.code).to.eql(500);
          return;
        }
        throw new Error('Error should have been thrown');
      });
    });

    describe('when empty response is not allowed', function() {
      it('should throw error if response body is empty', async () => {
        apiResponse.data = '';

        try {
          await wrapper.send();
        } catch (err) {
          expect(err).to.be.an.instanceof(EscherRequestError);
          expect(err.message).to.eql('Empty http response');
          expect(err.code).to.eql(500);
          expect(err.data).to.eql(expectedApiResponse.statusMessage);
          return;
        }
        throw new Error('Error should have been thrown');
      });

      it('should throw error with status message if response body is empty and status message exists', async () => {
        apiResponse.data = '';
        apiResponse.statusText = 'dummy status message';

        try {
          await wrapper.send();
        } catch (err) {
          expect(err.data).to.eql(apiResponse.statusText);
          return;
        }
        throw new Error('Error should have been thrown');
      });

      it('should throw a http response error even if the response body is empty', async () => {
        apiResponse.data = '404 Not Found';
        apiResponse.status = 404;
        apiResponse.headers = { 'content-type': 'text/plain' };

        try {
          await wrapper.send();
          throw new Error('should throw');
        } catch (err) {
          expect(err).to.be.an.instanceOf(EscherRequestError);
          expect(err.code).to.eql(apiResponse.status);
          expect(err.message).to.eql('Error in http response (status: 404)');
          expect(err.data).to.eql(apiResponse.data);
        }
      });
    });

    describe('when there was an axios error', function() {
      let isCancel;
      let axiosError;

      beforeEach(function() {
        axiosError = {
          message: 'axios error message',
          stack: []
        };
        isCancel = sinon.stub(axios, 'isCancel');
        requestGetStub.rejects(axiosError);
      });

      context('when the request has not been canceled', function() {
        beforeEach(function() {
          isCancel.returns(false);
        });

        it('cancels the request', async () => {
          try {
            await wrapper.send();
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

        it('does not cancel the request', async () => {
          try {
            await wrapper.send();
            throw new Error('should throw SuiteRequestError');
          } catch (err) {
            expect(source.cancel).not.to.have.been.calledWith();
          }
        });
      });

      it('should pass original error code to SuiteRequestError', async () => {
        try {
          axiosError.code = 'ECONNABORTED';

          await wrapper.send();
          throw new Error('should throw SuiteRequestError');
        } catch (err) {
          expect(err.originalCode).to.eql('ECONNABORTED');
          expect(err.code).to.eql(503);
          expect(err.data).to.eql({ replyText: 'axios error message' });
        }
      });
    });


    it('should throw error if json is not parsable (malformed)', async () => {
      apiResponse.data = 'this is an invalid json';

      try {
        await wrapper.send();
      } catch (err) {
        expect(err).to.be.an.instanceof(EscherRequestError);
        expect(err.message).to.match(/Unexpected token/);
        expect(err.code).to.eql(500);
        return;
      }
      throw new Error('Error should have been thrown');
    });

    it('should parse JSON if content-type header contains charset too', async () => {
      const testJson = { text: 'Test JSON text' };
      apiResponse.headers['content-type'] = 'application/json; charset=utf-8';
      apiResponse.data = JSON.stringify(testJson);

      const response = await wrapper.send();

      expect(response.body).to.eql(testJson);
    });

    it('should send GET request with given timeout in options', async () => {
      escherRequestOptions.timeout = 60000;
      await (new RequestWrapper(escherRequestOptions, 'http:')).send();

      const requestArgument = requestGetStub.args[0][0];
      expect(requestArgument.timeout).to.eql(escherRequestOptions.timeout);
    });
  });
});
