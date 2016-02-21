'use strict';

var Wrapper = require('./wrapper');
var request = require('request');

describe('Wrapper', function() {

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

  it('sends a GET new request', function *() {
    var apiRespone = {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        data: 1
      })
    };

    var requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
      callback(null, apiRespone);
    });

    var protocol = 'http:';

    var wrapper = new Wrapper(escherRequestOptions, protocol);

    var response = yield wrapper.send();
    expect(response).to.be.eql(apiRespone);
    expect(requestGetStub).to.be.calledWith(requestOptions);
  });

  it('sends a GET new request and recieves 400', function *() {
    var apiRespone = {
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        replyText: 'Unknown route'
      }),
      statusCode: 400
    };

    var requestGetStub = this.sandbox.stub(request, 'get', function(options, callback) {
      callback(null, apiRespone);
    });

    var protocol = 'http:';

    var wrapper = new Wrapper(escherRequestOptions, protocol);

    try {
      yield wrapper.send();
    } catch (err) {
      expect(err).to.be.eql({
        message: 'Error in http response',
        name: 'SuiteRequestError',
        code: 400,
        data: {
          replyText: 'Error in http response'
        },
        replyText: 'Unknown route'
      });
      expect(requestGetStub).to.be.calledWith(requestOptions);
      return;
    }

    throw new Error('Error should have been thrown');
  });
});
