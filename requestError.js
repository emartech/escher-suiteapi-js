var SuiteRequestError = function(message, code, data) {
  this.message = message;
  this.name = 'SuiteRequestError';
  this.code = code;
  this.data = data;
};

SuiteRequestError.prototype = Error.prototype;

module.exports = SuiteRequestError;