'use strict';

var _ = require('lodash');

var SuiteRequestError = function(message, code, data) {
  this.message = message;
  this.name = 'SuiteRequestError';
  this.code = code;
  this.data = {
    replyText: message
  };
  this.stack = new Error().stack;

  _.extend(this, data);
};

SuiteRequestError.prototype = Object.create(Error.prototype);

module.exports = SuiteRequestError;
