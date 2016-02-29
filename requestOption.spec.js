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

    expect(requestOptions.getHeader('header-name')).to.eql('header-value');
  });

  it('should add default content type', function() {
    var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

    expect(requestOptions.getHeader('content-type')).to.eql('application/json');
  });

  it('should not duplicate headers with same name', function() {
    var expectedContentTypeHeader = ['content-type', 'text/csv'];
    var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

    requestOptions.setHeader(expectedContentTypeHeader);

    expect(requestOptions.getHeader('content-type')).to.eql('text/csv');
  });
});
