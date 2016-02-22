'use strict';

var SuiteRequestOption = require('./requestOption');

describe('SuiteRequestOption', function() {

  var dummyServiceConfig = {
    host: 'localhost',
    port: 1234,
    prefix: '/api',
    rejectUnauthorized: false,
    secure: true,
    credentialScope: 'eu/dummy/ems_request'
  };

  it('can accept additional headers', function() {
    var dummyHeader = ['header-name', 'header-value'];
    var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

    requestOptions.setHeader(dummyHeader);

    expect(requestOptions.toHash().headers).to.include(dummyHeader);
  });

  it('should add default content type', function() {
    var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

    var contentTypeHeader = requestOptions.toHash().headers.filter(function(header) {
      return header[0] === 'content-type';
    });

    expect(contentTypeHeader).to.eql([['content-type', 'application/json']]);
  });

  it('should not duplicate headers with same name', function() {
    var expectedContentTypeHeader = ['content-type', 'text/csv'];
    var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

    requestOptions.setHeader(expectedContentTypeHeader);

    var contentTypeHeader = requestOptions.toHash().headers.filter(function(header) {
      return header[0] === 'content-type';
    });

    expect(contentTypeHeader).to.eql([expectedContentTypeHeader]);
  });
});
