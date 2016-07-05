'use strict';

var SuiteRequestOption = require('./requestOption');

describe('SuiteRequestOption', function() {

  var dummyServiceConfig;

  beforeEach(function() {
    dummyServiceConfig = {
      host: 'localhost',
      port: 1234,
      prefix: '/api',
      rejectUnauthorized: false,
      secure: true,
      credentialScope: 'eu/dummy/ems_request'
    };
  });

  describe('header handling', function() {

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

  describe('allowEmptyResponse', function() {
    it('should be set to false by default', function() {
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.allowEmptyResponse).to.eql(false);
    });

    it('should be set to the value provided in config', function() {
      dummyServiceConfig.allowEmptyResponse = true;
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.allowEmptyResponse).to.eql(true);
    });
  });

  describe('timeout', function() {
    it('should return a default value', function() {
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.getTimeout()).to.be.eql(15000);
    });

    it('should return the timeout passed in the constructor', function() {
      var options = Object.assign({}, dummyServiceConfig);
      options.timeout = 0;
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, options);

      expect(requestOptions.getTimeout()).to.be.eql(0);
    });

    it('should return the timeout set by setTimeout', function() {
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      requestOptions.setTimeout(60000);

      expect(requestOptions.getTimeout()).to.be.eql(60000);
    });

  });

  describe('toHash', function() {

    it('should return the proper object', function() {
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.toHash()).to.be.eql({
        headers: [
          ['content-type', 'application/json'],
          ['host', 'localhost']
        ],
        host: 'localhost',
        port: 1234,
        prefix: '/api',
        rejectUnauthorized: false,
        timeout: 15000
      });
      expect(requestOptions.toHash()).to.not.have.property('allowEmptyResponse');
    });

    it('should add allowEmptyResponse to hash if set to TRUE', function() {
      dummyServiceConfig.allowEmptyResponse = true;
      var requestOptions = new SuiteRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.toHash()).to.have.property('allowEmptyResponse', true);
    });

  });

});
