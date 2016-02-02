'use strict';

var _ = require('lodash');

var SuiteRequestError = function(message, code, data) {
  this.message = message;
  this.name = 'SuiteRequestError';
  this.code = code;
  this.data = {
    replyText: message
  };

  _.extend(this, data);
};

SuiteRequestError.prototype = new Error();

module.exports = SuiteRequestError;
