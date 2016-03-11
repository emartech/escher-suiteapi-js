'use strict';
var _ = require('lodash');

var SuiteRequestError = function(message, code, response) {
  this.message = message;
  this.name = 'SuiteRequestError';
  this.code = code;
  if (response) {
    this.data = _.cloneDeep(response.data|| response);
  } else {
    this.data = {
      replyText: message
    };
  }

  this.stack = new Error(message).stack;
};

SuiteRequestError.prototype = Object.create(Error.prototype);

module.exports = SuiteRequestError;
