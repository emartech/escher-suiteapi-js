'use strict';

var SuiteRequestError = require('./requestError');

describe('SuiteRequestError', function() {
  it('should extend base Error class', function() {
    var error = new SuiteRequestError();

    expect(error).to.be.an.instanceOf(Error);
  });

  it('should store constructor parameters', function() {
    var error = new SuiteRequestError('Invalid request', 400, { detailedMessage: 'Line too long' });

    expect(error.message).to.eql('Invalid request');
    expect(error.code).to.eql(400);
    expect(error.data).to.eql({ detailedMessage: 'Line too long', replyText: 'Invalid request' });
  });

  it('should always contain replyText in data', function() {
    var error = new SuiteRequestError('Unauthorized');

    expect(error.data.replyText).to.eql('Unauthorized');
  });
});