'use strict';

var SuiteRequestError = function(message, code, data) {
  this.message = message;
  this.name = 'SuiteRequestError';
  this.code = code;
  this.data = data;
  this.stack = new Error(message).stack;
};

SuiteRequestError.prototype = Object.create(Error.prototype);

module.exports = SuiteRequestError;
