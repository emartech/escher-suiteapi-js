const { EscherRequestOption } = require('./requestOption');

describe('EscherRequestOption', function() {
  let dummyServiceConfig;

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

  describe('create', function() {
    it('should populate options with parameters', function() {
      const options = EscherRequestOption.create('example-host', '/api-test', true);

      expect(options.rejectUnauthorized).to.eql(true);
      expect(options.host).to.eql('example-host');
      expect(options.prefix).to.eql('/api-test');
    });

    it('should populate options with default parameters', function() {
      const options = EscherRequestOption.create('example-host');

      expect(options.rejectUnauthorized).to.eql(true);
      expect(options.host).to.eql('example-host');
      expect(options.prefix).to.eql('');
    });

    it('should populate options with for internal api', function() {
      const options = EscherRequestOption.createForInternalApi('example-host', true);

      expect(options.rejectUnauthorized).to.eql(true);
      expect(options.host).to.eql('example-host');
      expect(options.prefix).to.eql('/api/v2/internal');
    });

    it('should populate options with for services api', function() {
      const options = EscherRequestOption.createForServiceApi('example-host', true);

      expect(options.rejectUnauthorized).to.eql(true);
      expect(options.host).to.eql('example-host');
      expect(options.prefix).to.eql('/api/services');
    });
  });

  describe('header handling', function() {

    it('can accept additional headers', function() {
      const dummyHeader = ['header-name', 'header-value'];
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      requestOptions.setHeader(dummyHeader);

      expect(requestOptions.getHeader('header-name')).to.eql('header-value');
    });

    it('should add default content type', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.getHeader('content-type')).to.eql('application/json');
    });

    it('should not duplicate headers with same name', function() {
      const expectedContentTypeHeader = ['content-type', 'text/csv'];
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      requestOptions.setHeader(expectedContentTypeHeader);

      expect(requestOptions.getHeader('content-type')).to.eql('text/csv');
    });

  });

  describe('allowEmptyResponse', function() {
    it('should be set to false by default', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.allowEmptyResponse).to.eql(false);
    });

    it('should be set to the value provided in config', function() {
      dummyServiceConfig.allowEmptyResponse = true;
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.allowEmptyResponse).to.eql(true);
    });
  });

  describe('timeout', function() {
    it('should return a default value', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.getTimeout()).to.be.eql(15000);
    });

    it('should return the timeout passed in the constructor', function() {
      const options = Object.assign({}, dummyServiceConfig);
      options.timeout = 0;
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, options);

      expect(requestOptions.getTimeout()).to.be.eql(0);
    });

    it('should return the timeout set by setTimeout', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      requestOptions.setTimeout(60000);

      expect(requestOptions.getTimeout()).to.be.eql(60000);
    });

  });

  describe('toHash', function() {

    it('should return the proper object', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.toHash()).to.be.eql({
        headers: [
          ['content-type', 'application/json'],
          ['host', 'localhost']
        ],
        host: 'localhost',
        port: 1234,
        prefix: '/api',
        rejectUnauthorized: false,
        timeout: 15000,
        maxContentLength: 10485760
      });
      expect(requestOptions.toHash()).to.not.have.property('allowEmptyResponse');
    });

    it('should add allowEmptyResponse to hash if set to TRUE', function() {
      dummyServiceConfig.allowEmptyResponse = true;
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      expect(requestOptions.toHash()).to.have.property('allowEmptyResponse', true);
    });

    it('should not cache headers', function() {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);
      requestOptions.toHash().headers.push('from_test');
      expect(requestOptions.toHash().headers).not.to.include('from_test');
    });
  });

  describe('setHost', () => {
    it('should set host', () => {
      const requestOptions = new EscherRequestOption(dummyServiceConfig.host, dummyServiceConfig);

      requestOptions.setHost('suitedocker.ett.local');

      expect(requestOptions.host).to.eql('suitedocker.ett.local');
    });
  });
});
