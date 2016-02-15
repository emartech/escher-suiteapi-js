'use strict';

var SuiteRequestOption = require('./requestOption');
var expect = require('chai').expect;

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

    requestOptions.addHeader(dummyHeader);

    expect(requestOptions.toHash().headers).to.include(dummyHeader);
  });

});
